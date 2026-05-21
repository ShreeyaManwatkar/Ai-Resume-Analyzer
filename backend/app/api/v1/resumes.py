import os
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.config import settings
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.schemas.resume import ResumeResponse, ResumeDetailResponse
from app.services.parser import calculate_sha256, extract_text_from_pdf
from app.core.rate_limit import rate_limiter

router = APIRouter()

@router.post(
    "/upload", 
    response_model=ResumeDetailResponse, 
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limiter)]
)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a resume PDF, extract text, hash it to detect duplicates, 
    and save the file locally.
    """
    # 1. Enforce PDF only
    if not file.filename.lower().endswith(".pdf") or file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported."
        )

    # Read file content into memory
    file_bytes = await file.read()
    
    # 1.b Enforce Size Limit (5MB)
    MAX_FILE_SIZE = 5 * 1024 * 1024 # 5 MB
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File is too large. Maximum allowed size is 5MB."
        )
    
    # 2. Calculate file hash to prevent double uploads
    file_hash = calculate_sha256(file_bytes)
    
    # Check if this user already uploaded this exact file
    result = await db.execute(
        select(Resume).filter(
            Resume.user_id == current_user.id, 
            Resume.file_hash == file_hash
        )
    )
    existing_resume = result.scalars().first()
    if existing_resume:
        # User uploaded the same file - return existing record (cached ux)
        return existing_resume

    # 3. Extract text from PDF
    try:
        extracted_text = extract_text_from_pdf(file_bytes)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    # 4. Save file to local storage with UUID to avoid collision
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    try:
        with open(file_path, "wb") as f:
            f.write(file_bytes)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write file to disk: {str(e)}"
        )

    # 5. Save metadata and text to database
    new_resume = Resume(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path,
        file_hash=file_hash,
        extracted_text=extracted_text
    )
    
    db.add(new_resume)
    await db.commit()
    await db.refresh(new_resume)
    
    return new_resume


@router.get("/", response_model=List[ResumeResponse])
async def list_resumes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all resumes uploaded by the current user.
    """
    result = await db.execute(
        select(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{resume_id}", response_model=ResumeDetailResponse)
async def get_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed information about a specific resume (including extracted text).
    """
    result = await db.execute(
        select(Resume).filter(
            Resume.id == resume_id, 
            Resume.user_id == current_user.id
        )
    )
    resume = result.scalars().first()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found."
        )
    return resume


@router.delete("/{resume_id}", status_code=status.HTTP_200_OK)
async def delete_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a resume record from database and its corresponding file on disk.
    """
    result = await db.execute(
        select(Resume).filter(
            Resume.id == resume_id, 
            Resume.user_id == current_user.id
        )
    )
    resume = result.scalars().first()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found."
        )
        
    # Delete file from local storage
    if os.path.exists(resume.file_path):
        try:
            os.remove(resume.file_path)
        except Exception as e:
            # We log the error but proceed to delete DB record so DB stays clean
            print(f"Warning: Failed to delete file {resume.file_path}: {e}")
            
    # Delete database record
    await db.delete(resume)
    await db.commit()
    
    return {"message": "Resume deleted successfully."}
