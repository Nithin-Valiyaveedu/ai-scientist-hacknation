import asyncio
from functools import partial

from fastapi import APIRouter
from pydantic import BaseModel

from services.compare import find_alternatives, get_substance_details

router = APIRouter(tags=["compare"])


class CompareRequest(BaseModel):
    name: str
    supplier: str
    quantity: str = ""
    catalog_number: str = ""


@router.post("/compare-material")
async def compare_material(req: CompareRequest):
    loop = asyncio.get_event_loop()

    # Run both searches concurrently
    alternatives_task = loop.run_in_executor(
        None,
        partial(find_alternatives, req.name, req.supplier, req.quantity),
    )
    details_task = loop.run_in_executor(
        None,
        partial(get_substance_details, req.name, req.supplier, req.catalog_number),
    )

    alternatives, current_details = await asyncio.gather(alternatives_task, details_task)

    return {
        "current_details": current_details,   # { cas_number, purity, grade, form }
        "alternatives": alternatives,
    }
