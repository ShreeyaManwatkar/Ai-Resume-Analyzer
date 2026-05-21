from fastapi import APIRouter
from app.api.v1 import auth, resumes, jobs, analyzer

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(resumes.router, prefix="/resumes", tags=["Resumes"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])
api_router.include_router(analyzer.router, prefix="/analyzer", tags=["Analyzer"])
