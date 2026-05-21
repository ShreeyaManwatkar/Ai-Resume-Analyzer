import json
import asyncio
import re
from typing import Dict, Any
import google.generativeai as genai
from app.core.config import settings

# Configure Gemini if the key is provided
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

def get_mock_analysis(resume_text: str, job_description: str) -> Dict[str, Any]:
    """
    Fallback mock analysis generator when GEMINI_API_KEY is not configured.
    Generates a structured, semi-realistic response by extracting keywords.
    """
    # Extract potential keywords from JD (simple regex)
    jd_words = set(re.findall(r'\b[A-Za-z0-9+#\-\.]+\b', job_description.lower()))
    resume_words = set(re.findall(r'\b[A-Za-z0-9+#\-\.]+\b', resume_text.lower()))
    
    # Common tech keywords to look for
    tech_keywords = {
        "python", "fastapi", "sqlalchemy", "mysql", "postgresql", "sqlite",
        "react", "next.js", "javascript", "typescript", "tailwind", "css",
        "docker", "kubernetes", "aws", "gcp", "git", "github", "ci/cd",
        "testing", "pytest", "rest", "api", "jwt", "agile", "scrum"
    }
    
    matched = list(tech_keywords.intersection(jd_words).intersection(resume_words))
    missing = list(tech_keywords.intersection(jd_words).difference(resume_words))
    
    # Calculate a simple score based on match ratio
    total_tech_in_jd = len(tech_keywords.intersection(jd_words))
    if total_tech_in_jd > 0:
        score = int((len(matched) / total_tech_in_jd) * 100)
    else:
        score = 65  # default baseline
        
    # Cap score between 30 and 95 for realism
    score = max(min(score, 95), 30)
    
    # Compile mock skill gap recommendations
    skill_gaps = []
    for skill in missing[:3]:
        skill_gaps.append({
            "skill": skill.capitalize(),
            "severity": "High" if skill in ["python", "fastapi", "react", "docker"] else "Medium",
            "recommendation": f"Add a project to your resume using {skill.capitalize()} or detail your experience working with it."
        })
        
    # Standard fallback mock response matching Gemini schema
    return {
        "ats_score": score,
        "keywords_matched": [k.capitalize() for k in matched],
        "keywords_missing": [k.capitalize() for k in missing],
        "skill_gap_analysis": skill_gaps or [
            {
                "skill": "Docker",
                "severity": "Medium",
                "recommendation": "Containerization skills were requested. Include Docker config files in your portfolio projects."
            }
        ],
        "formatting_feedback": "Your resume has a strong core structure. We recommend adding quantified achievements (e.g. percentage improvements) to all experience bullet points to increase visual appeal for recruiters.",
        "bullet_point_improvements": [
            {
                "original": "Worked on the backend database structure.",
                "improved": "Optimized database query performance by 25% by migrating blocking database operations to async SQLAlchemy models.",
                "rationale": "Introduced dynamic metrics, identified specific frameworks, and demonstrated optimization skills."
            }
        ]
    }


def _call_gemini_sync(prompt: str) -> str:
    """
    Blocking synchronous function to call Gemini model.
    Runs inside a thread pool with multi-stage backwards compatibility.
    """
    models_to_try = ["gemini-1.5-flash", "gemini-pro"]
    last_error = None
    
    for model_name in models_to_try:
        try:
            # 1. Try modern JSON mime-type config
            model = genai.GenerativeModel(
                model_name=model_name,
                generation_config={
                    "response_mime_type": "application/json",
                    "temperature": 0.2,
                }
            )
            response = model.generate_content(prompt)
            return response.text
        except Exception as e1:
            try:
                # 2. Try standard config (older SDK package version support)
                model = genai.GenerativeModel(
                    model_name=model_name,
                    generation_config={
                        "temperature": 0.2,
                    }
                )
                response = model.generate_content(prompt)
                return response.text
            except Exception as e2:
                last_error = e2
                continue
                
    if last_error:
        raise last_error
    raise RuntimeError("Gemini API initialization failed for all model targets.")




async def analyze_resume_vs_job(resume_text: str, job_description: str) -> Dict[str, Any]:
    """
    Asynchronously analyze a resume against a job description.
    Wraps the blocking Gemini HTTP call inside a separate worker thread.
    """
    if not settings.GEMINI_API_KEY:
        # If API key is missing, return mock analysis directly
        await asyncio.sleep(1.0) # Simulate network lag
        return get_mock_analysis(resume_text, job_description)
        
    prompt = f"""
You are an expert ATS (Applicant Tracking System) optimizer and senior technical recruiter.
Compare the candidate's resume text below against the job description.
Provide an objective match score (0-100), analyze matching and missing keywords, perform a skill gap analysis, provide formatting feedback, and rewrite weak bullet points using the STAR method (quantified impact, active verbs).

Your response MUST be a single valid JSON object matching the following structure:
{{
  "ats_score": integer (0 to 100),
  "keywords_matched": ["skill1", "skill2"],
  "keywords_missing": ["skill3", "skill4"],
  "skill_gap_analysis": [
    {{
      "skill": "skill name",
      "severity": "High" | "Medium" | "Low",
      "recommendation": "concrete steps to fix this gap"
    }}
  ],
  "formatting_feedback": "general structural and layout feedback",
  "bullet_point_improvements": [
    {{
      "original": "original bullet point",
      "improved": "improved bullet point with active verbs and metrics",
      "rationale": "why this is better"
    }}
  ]
}}

Ensure that all json properties are present and properly enclosed in double quotes. Do not include markdown code block backticks (like ```json ... ```).

Candidate Resume Text:
{resume_text}

Job Description:
{job_description}
"""

    try:
        # Run blocking HTTP call in a worker thread to prevent event loop blocking
        raw_response = await asyncio.to_thread(_call_gemini_sync, prompt)
        
        # Clean up any potential accidental markdown markers
        cleaned = raw_response.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```[a-zA-Z]*\n", "", cleaned)
            cleaned = re.sub(r"\n```$", "", cleaned)
            
        return json.loads(cleaned)
    except Exception as e:
        print(f"Error calling Gemini: {e}. Falling back to mock analysis...")
        # Graceful fallback to mock on API or JSON parsing errors
        return get_mock_analysis(resume_text, job_description)
