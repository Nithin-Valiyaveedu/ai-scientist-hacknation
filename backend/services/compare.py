"""
Alternative-product comparison service.

For a given reagent, runs a broad Tavily search (no site: filter) to find
the same product listed by competing suppliers, then uses GPT-4o-mini to
extract a structured alternatives list.
"""
import json
import logging
import os
import re

logger = logging.getLogger(__name__)

_SUPPLIER_ALIASES: dict[str, str] = {
    "milliporesigma":      "Sigma-Aldrich",
    "sigma aldrich":       "Sigma-Aldrich",
    "thermo fisher":       "ThermoFisher",
    "thermo scientific":   "ThermoFisher",
    "life technologies":   "ThermoFisher",
    "invitrogen":          "ThermoFisher",
    "bio rad":             "Bio-Rad",
    "fisher scientific":   "Fisher Scientific",
    "fishersci":           "Fisher Scientific",
    "new england biolabs": "NEB",
}

_SUPPLIER_URLS: dict[str, str] = {
    "Sigma-Aldrich":     "sigmaaldrich.com",
    "ThermoFisher":      "thermofisher.com",
    "Bio-Rad":           "bio-rad.com",
    "Fisher Scientific": "fishersci.com",
    "VWR":               "vwr.com",
    "NEB":               "neb.com",
    "ATCC":              "atcc.org",
}


def _norm(s: str) -> str:
    return _SUPPLIER_ALIASES.get(s.strip().lower(), s.strip())


def find_alternatives(name: str, current_supplier: str, quantity: str = "") -> list[dict]:
    """
    Search for the same reagent offered by competing suppliers.

    Returns up to 4 dicts:
        { supplier, catalog_number, unit_price, url }

    Excludes the current supplier. Falls back to [] on any error.
    """
    if not os.getenv("TAVILY_API_KEY"):
        logger.warning("TAVILY_API_KEY not set — skipping comparison search")
        return []

    current_norm = _norm(current_supplier)
    query = f'"{name}" reagent lab buy catalog number price'

    try:
        from langchain_community.tools.tavily_search import TavilySearchResults
        results = TavilySearchResults(max_results=8, include_answer=True).invoke(query)

        if not results:
            return []

        snippets = "\n\n".join(
            f"URL: {r.get('url', '')}\n{(r.get('content') or '')[:500]}"
            for r in results[:7]
        )

        from langchain_openai import ChatOpenAI
        from langchain_core.prompts import ChatPromptTemplate
        from langchain_core.output_parsers import StrOutputParser

        prompt = ChatPromptTemplate.from_messages([
            ("system",
             "You are a lab procurement assistant. "
             "Given search snippets from various supplier websites, extract alternative "
             "sources for the requested reagent.\n\n"
             "For each distinct supplier found (EXCLUDING the current supplier), output:\n"
             "  - supplier: the supplier company name\n"
             "  - catalog_number: the SKU/catalog number (or null)\n"
             "  - unit_price: a realistic USD price for the pack size closest to the requested "
             "quantity (use your knowledge if not visible in snippets)\n"
             "  - url: the most specific product page URL from the snippets (or null)\n"
             "  - cas_number: the CAS registry number e.g. '7732-18-5' (or null)\n"
             "  - purity: purity specification e.g. '≥99.5%', '99%' (or null)\n"
             "  - grade: quality grade e.g. 'Molecular Biology Grade', 'ACS Reagent', "
             "'HPLC Grade', 'BioReagent' (or null)\n"
             "  - form: physical form e.g. 'Powder', 'Solution', 'Crystal', 'Liquid' (or null)\n\n"
             "Return ONLY valid JSON — an array of up to 4 objects:\n"
             '[{{"supplier":"NEB","catalog_number":"M0530S","unit_price":89.00,'
             '"url":"https://...","cas_number":"9007-49-2","purity":null,'
             '"grade":"Molecular Biology Grade","form":"Solution"}}]\n'
             "If no alternatives found, return []."),
            ("human",
             f"Reagent: {name}\n"
             f"Requested quantity: {quantity or 'standard pack'}\n"
             f"Current supplier (EXCLUDE from results): {current_norm}\n\n"
             f"Search snippets:\n{snippets}"),
        ])

        raw = (
            prompt | ChatOpenAI(model="gpt-4o-mini", temperature=0) | StrOutputParser()
        ).invoke({}).strip()

        raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw, flags=re.MULTILINE).strip()
        alternatives = json.loads(raw)

        if not isinstance(alternatives, list):
            return []

        cleaned = []
        for alt in alternatives:
            sup = _norm(str(alt.get("supplier", "")))
            if not sup or sup.lower() == current_norm.lower():
                continue
            price = alt.get("unit_price")
            try:
                price = float(price) if price is not None else None
            except (TypeError, ValueError):
                price = None

            url = alt.get("url") or None
            # Fall back to supplier homepage if no url
            if not url:
                domain = _SUPPLIER_URLS.get(sup)
                url = f"https://www.{domain}" if domain else None

            cleaned.append({
                "supplier":       sup,
                "catalog_number": alt.get("catalog_number") or "N/A",
                "unit_price":     price,
                "url":            url,
                "cas_number":     alt.get("cas_number") or None,
                "purity":         alt.get("purity") or None,
                "grade":          alt.get("grade") or None,
                "form":           alt.get("form") or None,
            })

        logger.info("Found %d alternatives for %r", len(cleaned), name)
        return cleaned[:4]

    except Exception as exc:
        logger.warning("Comparison search failed for %r: %s", name, exc)
        return []


def get_substance_details(name: str, supplier: str, catalog_number: str = "") -> dict:
    """
    Fetch CAS number, purity, grade, and physical form for the current product
    using a targeted Tavily search. Returns a partial dict (fields may be None).
    """
    if not os.getenv("TAVILY_API_KEY"):
        return {}

    sup   = _norm(supplier)
    query = f'"{name}" {sup} {catalog_number} CAS number purity grade specifications'.strip()

    try:
        from langchain_community.tools.tavily_search import TavilySearchResults
        results = TavilySearchResults(max_results=5, include_answer=True).invoke(query)

        if not results:
            return {}

        snippets = "\n\n".join(
            f"URL: {r.get('url', '')}\n{(r.get('content') or '')[:500]}"
            for r in results[:4]
        )

        from langchain_openai import ChatOpenAI
        from langchain_core.prompts import ChatPromptTemplate
        from langchain_core.output_parsers import StrOutputParser

        prompt = ChatPromptTemplate.from_messages([
            ("system",
             "You are a lab procurement assistant. Extract substance properties from supplier "
             "page snippets for the specified reagent.\n\n"
             "Output ONLY valid JSON with these fields (use null if not found):\n"
             '{{"cas_number": "7732-18-5", "purity": "≥99.5%", '
             '"grade": "Molecular Biology Grade", "form": "Powder"}}'),
            ("human",
             f"Reagent: {name}\nSupplier: {sup}\nCatalog: {catalog_number or 'unknown'}\n\n"
             f"Search snippets:\n{snippets}"),
        ])

        raw = (
            prompt | ChatOpenAI(model="gpt-4o-mini", temperature=0) | StrOutputParser()
        ).invoke({}).strip()

        raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw, flags=re.MULTILINE).strip()
        data = json.loads(raw)

        return {
            "cas_number": data.get("cas_number") or None,
            "purity":     data.get("purity") or None,
            "grade":      data.get("grade") or None,
            "form":       data.get("form") or None,
        }

    except Exception as exc:
        logger.warning("Substance details lookup failed for %r: %s", name, exc)
        return {}
