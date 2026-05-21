from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field

class AnalysisRequest(BaseModel):
    resume_id: str = Field(..., description="ID of the uploaded resume to analyze")
    job_description: Optional[str] = Field(None, description="Raw text of the job description (optional if job_id is provided)")
    job_id: Optional[str] = Field(None, description="ID of a saved job description (optional if job_description is provided)")

class ReportResponse(BaseModel):
    id: str
    resume_id: str
    job_id: Optional[str]
    ats_score: int
    analysis_payload: Dict[str, Any]
    created_at: datetime
    
    # Eager properties resolved from joined loads
    resume_filename: Optional[str] = None
    job_title: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

