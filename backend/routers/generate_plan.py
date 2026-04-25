from fastapi import APIRouter, HTTPException
from models.schemas import GeneratePlanRequest, ExperimentPlan
from services.planner import generate_experiment_plan

router = APIRouter()


@router.post("/generate-plan", response_model=ExperimentPlan)
async def generate_plan(body: GeneratePlanRequest) -> ExperimentPlan:
    """
    Generates a complete experiment plan with protocol, materials, budget, and timeline.
    """
    try:
        plan = generate_experiment_plan(
            question=body.question,
            literature_context=body.literature_context,
            references=body.references,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return plan
