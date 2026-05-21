import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class Report(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_id: Mapped[str] = mapped_column(String(36), ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    job_id: Mapped[str] = mapped_column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=True)
    
    ats_score: Mapped[int] = mapped_column(Integer, nullable=False)
    # Stores the raw JSON dictionary received from Gemini (e.g. keywords, feedback, suggestions)
    analysis_payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="reports")
    resume: Mapped["Resume"] = relationship("Resume", back_populates="reports")
    job: Mapped["Job"] = relationship("Job", back_populates="reports")

    @property
    def resume_filename(self) -> str:
        """Helper property to access the related resume filename, if loaded."""
        return self.resume.filename if self.resume else "Deleted Resume"

    @property
    def job_title(self) -> str:
        """Helper property to access the related job description title, if loaded."""
        return self.job.title if self.job else "Direct Analysis"

