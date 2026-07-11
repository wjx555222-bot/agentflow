from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.workflow import Workflow
from app.schemas.workflow import WorkflowCreate, WorkflowUpdate, WorkflowResponse, WorkflowListResponse

router = APIRouter(prefix="/api/workflows", tags=["workflows"])


@router.get("", response_model=WorkflowListResponse)
async def list_workflows(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workflow).order_by(Workflow.updated_at.desc()))
    workflows = result.scalars().all()
    return WorkflowListResponse(
        workflows=[WorkflowResponse.model_validate(w) for w in workflows],
        total=len(workflows),
    )


@router.post("", response_model=WorkflowResponse, status_code=201)
async def create_workflow(wf_in: WorkflowCreate, db: AsyncSession = Depends(get_db)):
    workflow = Workflow(**wf_in.model_dump())
    db.add(workflow)
    await db.commit()
    await db.refresh(workflow)
    return WorkflowResponse.model_validate(workflow)


@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(workflow_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workflow).where(Workflow.id == workflow_id))
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return WorkflowResponse.model_validate(workflow)


@router.put("/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(workflow_id: str, wf_in: WorkflowUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workflow).where(Workflow.id == workflow_id))
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    update_data = wf_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(workflow, key, value)
    await db.commit()
    await db.refresh(workflow)
    return WorkflowResponse.model_validate(workflow)


@router.delete("/{workflow_id}", status_code=204)
async def delete_workflow(workflow_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workflow).where(Workflow.id == workflow_id))
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    await db.delete(workflow)
    await db.commit()
