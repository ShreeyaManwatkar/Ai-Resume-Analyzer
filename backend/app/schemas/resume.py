from datetime import datetime
from pydantic import BaseModel, ConfigDict

class ResumeResponse(BaseModel):
    id: str
    filename: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ResumeDetailResponse(ResumeResponse):
    extracted_text: str
