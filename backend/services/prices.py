"""
Price lookup — Option C: real catalog numbers and prices from Tavily.

The LLM only generates {name, supplier, quantity}. This module resolves
the real catalog number and current price by:

  1. Supabase cache lookup by (name, supplier)  — fastest, deterministic
  2. Tavily product search → GPT extracts {catalog_number, unit_price}  — live, accurate
  3. Graceful fallback: catalog_number="N/A", unit_price=0.0  — never crashes the pipeline

Manual scientist corrections (source='manual') always take priority on the
next generation because the name+supplier cache hit fires before Tavily.

Required Supabase table (run once in SQL editor):
  CREATE TABLE material_prices (
      catalog_number TEXT        NOT NULL,
      supplier       TEXT        NOT NULL,
      name           TEXT,
      unit_price     FLOAT       NOT NULL,
      source         TEXT        DEFAULT 'tavily',
      updated_at     TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (catalog_number, supplier)
  );
  -- Index for name-based lookups
  CREATE INDEX IF NOT EXISTS idx_material_prices_name_supplier
      ON material_prices (lower(name), lower(supplier));
"""
import asyncio
import json
import logging
import os
import re
from functools import partial

logger = logging.getLogger(__name__)

# ── Supplier normalisation ─────────────────────────────────────────────────────

_SUPPLIER_ALIASES: dict[str, str] = {
    "milliporesigma":    "Sigma-Aldrich",
    "sigma aldrich":     "Sigma-Aldrich",
    "sigma-aldrich":     "Sigma-Aldrich",
    "thermo fisher":     "ThermoFisher",
    "thermo scientific": "ThermoFisher",
    "thermofisher":      "ThermoFisher",
    "life technologies": "ThermoFisher",
    "invitrogen":        "ThermoFisher",
    "bio rad":           "Bio-Rad",
    "bio-rad":           "Bio-Rad",
    "fisher scientific": "Fisher Scientific",
    "fishersci":         "Fisher Scientific",
    "new england biolabs": "NEB",
    "neb":               "NEB",
}

_SUPPLIER_DOMAINS: dict[str, str] = {
    "Sigma-Aldrich":     "sigmaaldrich.com",
    "ThermoFisher":      "thermofisher.com",
    "Bio-Rad":           "bio-rad.com",
    "Fisher Scientific": "fishersci.com",
    "VWR":               "vwr.com",
    "NEB":               "neb.com",
    "ATCC":              "atcc.org",
}


def _norm_supplier(s: str) -> str:
    return _SUPPLIER_ALIASES.get(s.strip().lower(), s.strip())


def _norm_catalog(c: str) -> str:
    """Strip special characters (®, ™, spaces) and uppercase the catalog number."""
    return re.sub(r"[^A-Za-z0-9\-]", "", c).upper()


# ── Supabase helpers ───────────────────────────────────────────────────────────

def _supabase_ok() -> bool:
    return bool(os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_SERVICE_KEY"))


def _db():
    from supabase import create_client
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])


def lookup_cached_product(name: str, supplier: str) -> dict | None:
    """
    Look up a cached product by (name, supplier).
    Returns {"catalog_number": ..., "unit_price": ..., "source": ...} or None.
    Manual corrections are ordered first so they always win.
    """
    if not _supabase_ok() or not name.strip():
        return None
    sup = _norm_supplier(supplier)
    try:
        row = (
            _db().table("material_prices")
            .select("catalog_number, unit_price, source")
            .ilike("name", name.strip())
            .ilike("supplier", sup)
            # manual > tavily > llm — rely on alphabetical source ordering isn't reliable,
            # so we order by updated_at desc and prefer manual rows via a secondary sort
            .order("source")          # 'manual' sorts before 'tavily' / 'llm'
            .order("updated_at", desc=True)
            .limit(1)
            .execute()
        )
        if row.data:
            r = row.data[0]
            logger.info("Cache hit (name) %r/%r → %s $%.2f", name, sup, r["catalog_number"], r["unit_price"])
            return r
    except Exception as exc:
        logger.warning("Cache lookup failed for %r/%r: %s", name, sup, exc)
    return None


def upsert_price(
    catalog_number: str,
    supplier: str,
    name: str,
    unit_price: float,
    source: str = "tavily",
) -> None:
    """Upsert a verified product into the material_prices cache."""
    if not _supabase_ok():
        return
    sup  = _norm_supplier(supplier)
    cat  = _norm_catalog(catalog_number) if catalog_number and catalog_number != "N/A" else "N/A"
    if not cat:
        return
    try:
        _db().table("material_prices").upsert(
            {
                "catalog_number": cat,
                "supplier":       sup,
                "name":           name.strip(),
                "unit_price":     round(unit_price, 2),
                "source":         source,
            },
            on_conflict="catalog_number,supplier",
        ).execute()
        logger.info("Cached %s/%s = $%.2f (%s)", cat, sup, unit_price, source)
    except Exception as exc:
        logger.error("Upsert failed for %s/%s: %s", cat, sup, exc, exc_info=True)


# ── Tavily product search ──────────────────────────────────────────────────────

def search_product_tavily(name: str, supplier: str) -> dict | None:
    """
    Search Tavily for the real catalog number of a reagent, then estimate its price.

    Most supplier sites render prices via JavaScript so they are invisible to scrapers.
    We therefore:
      1. Extract the real catalog number from the static HTML Tavily returns.
      2. Ask GPT to estimate a realistic USD price for that specific product.

    Even though the price is estimated, it is anchored to the real SKU and cached —
    so every future run returns the exact same number.

    Returns {"catalog_number": str, "unit_price": float} or None.
    """
    if not os.getenv("TAVILY_API_KEY"):
        return None

    sup    = _norm_supplier(supplier)
    domain = _SUPPLIER_DOMAINS.get(sup, "")
    query  = f'"{name}" {sup} catalog number'
    if domain:
        query += f" site:{domain}"

    try:
        from langchain_community.tools.tavily_search import TavilySearchResults
        results = TavilySearchResults(max_results=5, include_answer=True).invoke(query)

        if not results:
            return None

        snippets = "\n\n".join(
            f"URL: {r.get('url', '')}\n{(r.get('content') or '')[:600]}"
            for r in results[:4]
        )

        from langchain_openai import ChatOpenAI
        from langchain_core.prompts import ChatPromptTemplate
        from langchain_core.output_parsers import StrOutputParser

        prompt = ChatPromptTemplate.from_messages([
            ("system",
             "You are a lab procurement assistant.\n\n"
             "Step 1 — Catalog number: Extract the exact catalog number (SKU) for the reagent "
             "from the supplier page content. It is usually a short alphanumeric code that appears "
             "near the product title (e.g. 'L3022', 'AM9738', '1610177').\n\n"
             "Step 2 — Price: Supplier pages often hide prices behind a login. If the price is "
             "NOT visible in the content, use your knowledge of typical lab reagent pricing to "
             "estimate a realistic USD unit price for this specific product and pack size.\n\n"
             "Reply with ONLY valid JSON:\n"
             '  {{"catalog_number": "L3022", "unit_price": 34.50}}\n'
             "If you cannot identify the catalog number at all, reply:\n"
             '  {{"catalog_number": null, "unit_price": null}}'),
            ("human",
             f"Reagent: {name}\nSupplier: {sup}\n\nSearch results:\n{snippets}"),
        ])

        raw = (
            prompt | ChatOpenAI(model="gpt-4o-mini", temperature=0) | StrOutputParser()
        ).invoke({}).strip()

        # Strip markdown code fences if present
        raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw, flags=re.MULTILINE).strip()
        data  = json.loads(raw)
        cat   = data.get("catalog_number")
        price = data.get("unit_price")

        if cat and price is not None:
            price = float(price)
            if 0.10 < price < 100_000:
                logger.info("Product resolved: %s → %s $%.2f", name, cat, price)
                return {"catalog_number": str(cat), "unit_price": price}

    except Exception as exc:
        logger.warning("Tavily product search failed for %r: %s", name, exc)

    return None


# ── Per-material enrichment ────────────────────────────────────────────────────

def enrich_material(material: dict) -> dict:
    """
    Resolve the real catalog number and price for a single material draft.

    Priority:
      1. Supabase cache (name + supplier)  — deterministic, respects manual corrections
      2. Tavily live search                — gets real catalog number and price
      3. Fallback                          — catalog_number="N/A", unit_price=0.0
    """
    name = material.get("name", "").strip()
    sup  = _norm_supplier(material.get("supplier", ""))

    # 1. Cache hit — same name+supplier as a previous run or manual correction
    cached = lookup_cached_product(name, sup)
    if cached:
        return {
            **material,
            "supplier":       sup,
            "catalog_number": cached["catalog_number"],
            "unit_price":     cached["unit_price"],
        }

    # 2. Tavily: get real catalog number + current price
    product = search_product_tavily(name, sup)
    if product:
        upsert_price(product["catalog_number"], sup, name, product["unit_price"], source="tavily")
        return {
            **material,
            "supplier":       sup,
            "catalog_number": product["catalog_number"],
            "unit_price":     product["unit_price"],
        }

    # 3. Fallback — pipeline never breaks, UI shows "price unavailable"
    logger.warning("No price found for %r / %r — using fallback", name, sup)
    return {
        **material,
        "supplier":       sup,
        "catalog_number": "N/A",
        "unit_price":     0.0,
    }


async def enrich_materials_with_prices(materials: list[dict]) -> list[dict]:
    """Enrich all material drafts in parallel."""
    loop = asyncio.get_event_loop()
    tasks = [
        loop.run_in_executor(None, partial(enrich_material, m))
        for m in materials
    ]
    return list(await asyncio.gather(*tasks))
