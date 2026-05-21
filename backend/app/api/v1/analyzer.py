from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.core.database import get_db
# ... (rest of imports remains active)

from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.models.job import Job
from app.models.report import Report
from app.schemas.report import AnalysisRequest, ReportResponse
from app.services.gemini import analyze_resume_vs_job

router = APIRouter()

@router.post("/analyze", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def analyze_resume(
    request: AnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Perform AI-powered ATS resume matching and keyword gap analysis.
    Saves and returns a structured analysis Report.
    """
    # 1. Fetch and validate resume ownership
    resume_result = await db.execute(
        select(Resume).filter(
            Resume.id == request.resume_id, 
            Resume.user_id == current_user.id
        )
    )
    resume = resume_result.scalars().first()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found or access denied."
        )

    # 2. Retrieve job description (either from saved job_id or raw text)
    job_description_text = ""
    job_id = None
    
    if request.job_id:
        job_result = await db.execute(
            select(Job).filter(
                Job.id == request.job_id, 
                Job.user_id == current_user.id
            )
        )
        job = job_result.scalars().first()
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Saved Job Description not found or access denied."
            )
        job_description_text = job.description
        job_id = job.id
    elif request.job_description:
        job_description_text = request.job_description.strip()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must provide either a saved job_id or a raw job_description string."
        )

    if not job_description_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description cannot be empty."
        )

    # 3. Call Gemini AI Matching Engine
    analysis_result = await analyze_resume_vs_job(
        resume_text=resume.extracted_text, 
        job_description=job_description_text
    )

    # 4. Save analysis report to the database
    new_report = Report(
        user_id=current_user.id,
        resume_id=resume.id,
        job_id=job_id,
        ats_score=analysis_result.get("ats_score", 0),
        analysis_payload=analysis_result
    )
    
    db.add(new_report)
    await db.commit()
    
    # Eagerly load the relationships for the newly created report to prevent lazy-load exceptions during serialization
    created_report_result = await db.execute(
        select(Report)
        .options(joinedload(Report.resume), joinedload(Report.job))
        .filter(Report.id == new_report.id)
    )
    return created_report_result.scalars().first()


@router.get("/reports", response_model=List[ReportResponse])
async def list_reports(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all saved analysis reports for the current user.
    """
    result = await db.execute(
        select(Report)
        .options(joinedload(Report.resume), joinedload(Report.job))
        .filter(Report.user_id == current_user.id)
        .order_by(Report.created_at.desc())
    )
    return result.scalars().all()


@router.get("/reports/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve details of a specific analysis report.
    """
    result = await db.execute(
        select(Report)
        .options(joinedload(Report.resume), joinedload(Report.job))
        .filter(
            Report.id == report_id, 
            Report.user_id == current_user.id
        )
    )
    report = result.scalars().first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found."
        )
    return report

