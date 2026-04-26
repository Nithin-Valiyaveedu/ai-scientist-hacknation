"""
Experiment plan generation — staged LLM calls with real progress.

Stage 1: Fetch expert corrections from Supabase (vector search)
Stage 2: Generate protocol (GPT call 1)
Stage 3: Generate materials (GPT call 2)
Stage 4: Generate budget + timeline + validation (GPT call 3)
"""
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

from models.schemas import (
    ExperimentPlan,
    ProtocolStep,
    ProtocolOnly,
    MaterialsOnly,
    MaterialDraftOnly,
    OverheadOnly,
    BudgetTimelineValidation,
)
from services.feedback import get_relevant_corrections, format_corrections_for_prompt


# temperature=0 across the entire pipeline — any variation here propagates into
# downstream prompts and produces different budget totals between runs.
_LLM = ChatOpenAI(model="gpt-4o-mini", temperature=0)


def _llm():
    return _LLM


def _steps_text(protocol: list[ProtocolStep]) -> str:
    """Stringify protocol steps for downstream prompts."""
    return "\n".join(f"{i+1}. {s.step}" for i, s in enumerate(protocol))


# ── Stage 2: Protocol ──────────────────────────────────────────────────────────

_PROTOCOL_PROMPT = ChatPromptTemplate.from_messages([
    ("system", (
        "You are an expert experimental scientist. Generate a precise, step-by-step lab protocol "
        "for the given hypothesis. Produce 8-15 specific, actionable steps grounded in published methods. "
        "Each step should be a single clear instruction a lab technician can follow directly.\n\n"
        "CITATIONS — this is mandatory:\n"
        "- You are given a list of reference URLs below.\n"
        "- For EVERY step, assign the most relevant reference URL(s) from that list to the 'citations' field.\n"
        "- Distribute citations across steps — do not concentrate them all on one step.\n"
        "- If a step is a general lab technique, cite the reference whose method is closest.\n"
        "- Only use URLs from the provided list — do not invent URLs.\n"
        "- Aim for at least 80% of steps to have at least one citation."
        "{corrections_block}"
    )),
    ("human", (
        "Hypothesis: {question}\n\n"
        "Literature context:\n{literature_context}\n\n"
        "References (you MUST cite these across protocol steps):\n{references}"
    )),
])


def generate_protocol(
    question: str,
    literature_context: str,
    refs_text: str,
    corrections_block: str,
) -> list[ProtocolStep]:
    chain = _PROTOCOL_PROMPT | _llm().with_structured_output(ProtocolOnly)
    result: ProtocolOnly = chain.invoke({
        "question": question,
        "literature_context": literature_context or "No prior literature found.",
        "references": refs_text,
        "corrections_block": corrections_block,
    })
    return result.protocol


# ── Stage 3: Materials (drafts — no catalog numbers or prices) ─────────────────
# Catalog numbers and prices are resolved by prices.py using Tavily so they are
# always real and deterministic. The LLM only decides *what* to order and *from whom*.

_MATERIALS_PROMPT = ChatPromptTemplate.from_messages([
    ("system", (
        "You are a lab procurement expert. Given a protocol, list the reagents needed.\n"
        "For each item specify:\n"
        "  • name     — the specific reagent or kit (e.g. 'Kanamycin sulfate', 'Q5 Hot Start Master Mix')\n"
        "  • supplier — the best supplier (Sigma-Aldrich, ThermoFisher, NEB, Bio-Rad, VWR, ATCC, etc.)\n"
        "  • quantity — how much is needed (e.g. '5 g', '1 kit', '500 µL')\n\n"
        "IMPORTANT: If previously used reagents are listed below, reuse their EXACT name and supplier. "
        "Only add new items for anything not already covered.\n"
        "Do NOT invent catalog numbers or prices — those will be fetched from real supplier data.\n"
        "Include 5–12 items covering all reagents, kits, and consumables required by the protocol."
        "{corrections_block}"
    )),
    ("human", (
        "Hypothesis: {question}\n\n"
        "Protocol steps:\n{protocol}\n\n"
        "Previously used reagents for this hypothesis (reuse exact names):\n{known_reagents}"
    )),
])


def _get_known_reagents(question: str) -> str:
    """Pull cached reagents whose names overlap with the hypothesis keywords."""
    from services.prices import _supabase_ok, _db
    if not _supabase_ok():
        return "None"
    # Use a few key words from the hypothesis to search the cache
    keywords = [w for w in question.split() if len(w) > 5][:6]
    try:
        rows = (
            _db().table("material_prices")
            .select("name, supplier, catalog_number")
            .or_(",".join(f"name.ilike.%{k}%" for k in keywords))
            .limit(15)
            .execute()
        )
        if not rows.data:
            return "None"
        return "\n".join(
            f"- {r['name']} ({r['supplier']}, SKU {r['catalog_number']})"
            for r in rows.data
        )
    except Exception:
        return "None"


def generate_materials(
    question: str,
    protocol: list[ProtocolStep],
    corrections_block: str,
) -> list[dict]:
    """
    Returns material drafts: [{name, supplier, quantity, catalog_number='', unit_price=0.0}]
    Seeded with cached reagents so the LLM reuses exact names → consistent cache hits.
    """
    known = _get_known_reagents(question)
    chain = _MATERIALS_PROMPT | _llm().with_structured_output(MaterialDraftOnly)
    result: MaterialDraftOnly = chain.invoke({
        "question":          question,
        "protocol":          _steps_text(protocol),
        "corrections_block": corrections_block,
        "known_reagents":    known,
    })
    return [
        {"name": m.name, "supplier": m.supplier, "quantity": m.quantity,
         "catalog_number": "", "unit_price": 0.0}
        for m in result.materials
    ]


# ── Stage 4: Overhead + Timeline + Validation ─────────────────────────────────
# Material costs come directly from the enriched materials list (deterministic).
# The LLM only estimates additional overhead: equipment, services, consumables.

_OVERHEAD_PROMPT = ChatPromptTemplate.from_messages([
    ("system", (
        "You are a scientific project manager. The reagent costs are already fixed — do NOT include them.\n"
        "Your job is to estimate ADDITIONAL overhead costs only:\n"
        "  • Equipment rental / depreciation (e.g. centrifuge time, flow cytometer)\n"
        "  • Core facility / sequencing services\n"
        "  • Consumables not in the materials list (gloves, tubes, plates, tips)\n"
        "  • Safety / waste disposal\n"
        "Produce 2–5 overhead line items with realistic USD costs.\n"
        "Also produce the timeline (2-4 phases) and validation criteria (2-4 items)."
        "{corrections_block}"
    )),
    ("human", (
        "Hypothesis: {question}\n\n"
        "Protocol:\n{protocol}\n\n"
        "Fixed reagent costs (already accounted for — do not repeat):\n{materials}"
    )),
])


def generate_budget_timeline_validation(
    question: str,
    protocol: list[ProtocolStep],
    materials: list[dict],
    corrections_block: str,
) -> dict:
    materials_text = "\n".join(
        f"- {m['name']} ({m.get('catalog_number','')}, {m.get('supplier','')}): ${m['unit_price']} / {m.get('quantity','')}"
        for m in materials
    )

    chain = _OVERHEAD_PROMPT | _llm().with_structured_output(OverheadOnly)
    result: OverheadOnly = chain.invoke({
        "question":          question,
        "protocol":          _steps_text(protocol),
        "materials":         materials_text,
        "corrections_block": corrections_block,
    })

    # ── Materials (exact, from price cache) ───────────────────────────────────
    material_lines  = [
        {"item": m["name"], "cost": round(float(m.get("unit_price", 0)), 2)}
        for m in materials
        if m.get("unit_price", 0) > 0
    ]
    materials_total = sum(l["cost"] for l in material_lines)

    # ── Overhead (fixed rate — LLM only supplies category names) ──────────────
    # Standard academic lab overhead is ~22% of reagent costs.
    # We fix the TOTAL overhead to this rate so the budget is fully deterministic
    # once material prices are locked. The LLM output only determines display names.
    OVERHEAD_RATE   = 0.22
    overhead_budget = round(materials_total * OVERHEAD_RATE, 2)

    raw = [(o.item, max(float(o.cost), 0.01)) for o in result.overhead] or [("Lab overhead", 1.0)]
    raw_sum = sum(c for _, c in raw)
    overhead_lines = [
        {"item": item, "cost": round((cost / raw_sum) * overhead_budget, 2)}
        for item, cost in raw
    ]
    # Fix any cent-rounding drift
    drift = round(overhead_budget - sum(l["cost"] for l in overhead_lines), 2)
    if overhead_lines:
        overhead_lines[0]["cost"] = round(overhead_lines[0]["cost"] + drift, 2)

    all_lines = material_lines + overhead_lines
    total     = round(sum(l["cost"] for l in all_lines), 2)

    return {
        "budget":       all_lines,
        "total_budget": total,
        "timeline":     [p.model_dump() for p in result.timeline],
        "validation":   [v.model_dump() for v in result.validation],
    }


# ── Single-shot (legacy, used by non-streaming endpoint) ──────────────────────

_PLAN_PROMPT = ChatPromptTemplate.from_messages([
    ("system", (
        "You are an expert experimental scientist and lab planner. "
        "Generate a complete, realistic experiment plan.\n\n"
        "Guidelines:\n"
        "- Protocol: 8-15 specific, actionable steps, each with citations from provided references\n"
        "- Materials: 5-12 items with real catalog numbers and USD prices\n"
        "- Budget: line items + total\n"
        "- Timeline: 2-4 phases with concrete tasks\n"
        "- Validation: 2-4 criteria with quantitative thresholds\n"
        "Be scientifically accurate and practically useful."
        "{corrections_block}"
    )),
    ("human", (
        "Hypothesis: {question}\n\n"
        "Literature context:\n{literature_context}\n\n"
        "References (cite in protocol steps where relevant):\n{references}"
    )),
])


def generate_experiment_plan(
    question: str,
    literature_context: str,
    references: list[str],
) -> ExperimentPlan:
    corrections = get_relevant_corrections(question)
    corrections_block = format_corrections_for_prompt(corrections)

    chain = _PLAN_PROMPT | _llm().with_structured_output(ExperimentPlan)
    refs_text = "\n".join(f"- {u}" for u in references) if references else "None"

    return chain.invoke({
        "question": question,
        "literature_context": literature_context or "No prior literature found.",
        "references": refs_text,
        "corrections_block": corrections_block,
    })
