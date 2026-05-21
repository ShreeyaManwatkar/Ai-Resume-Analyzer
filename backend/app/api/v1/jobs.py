from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.job import Job
from app.schemas.job import JobCreate, JobResponse

router = APIRouter()

@router.post("/", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    job_in: JobCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Save a new Job Description profile.
    """
    new_job = Job(
        user_id=current_user.id,
        title=job_in.title,
        company=job_in.company,
        description=job_in.description
    )
    
    db.add(new_job)
    await db.commit()
    await db.refresh(new_job)
    return new_job


@router.get("/", response_model=List[JobResponse])
async def list_jobs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all saved Job Descriptions for the current user.
    """
    result = await db.execute(
        select(Job)
        .filter(Job.user_id == current_user.id)
        .order_by(Job.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get details of a specific saved Job Description.
    """
    result = await db.execute(
        select(Job).filter(
            Job.id == job_id, 
            Job.user_id == current_user.id
        )
    )
    job = result.scalars().first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job description not found."
        )
    return job


@router.delete("/{job_id}", status_code=status.HTTP_200_OK)
async def delete_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a saved Job Description.
    """
    result = await db.execute(
        select(Job).filter(
            Job.id == job_id, 
            Job.user_id == current_user.id
        )
    )
    job = result.scalars().first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job description not found."
        )
        
    await db.delete(job)
    await db.commit()
    return {"message": "Job description deleted successfully."}
