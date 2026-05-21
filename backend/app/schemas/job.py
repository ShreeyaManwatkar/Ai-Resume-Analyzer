from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class JobBase(BaseModel):
    title: str = Field(..., max_length=255, description="Role title (e.g. Frontend Engineer)")
    company: Optional[str] = Field(None, max_length=255, description="Company name (optional)")
    description: str = Field(..., description="Full text of the job description requirements")

class JobCreate(JobBase):
    pass

class JobResponse(JobBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
