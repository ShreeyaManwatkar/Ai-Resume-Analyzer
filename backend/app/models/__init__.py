from app.models.base import Base
from app.models.user import User
from app.models.resume import Resume
from app.models.job import Job
from app.models.report import Report

# Expose all models so importing any model registers all dependencies correctly in SQLAlchemy
__all__ = ["Base", "User", "Resume", "Job", "Report"]
