# AI Resume Analyzer & ATS Matcher

## Project Overview
A production-ready, full-stack AI Resume Analyzer and Applicant Tracking System (ATS) Checker. This application parses PDF resumes, runs semantic keyword and skill comparisons against target job descriptions using Google Gemini AI, and provides structured feedback, skill gap action plans, and bullet point rewrites using the STAR method.

---

## Features
1. **Secure JWT Authentication**: Salting and hashing via bcrypt; state-persisted authorization guards.
2. **Resume PDF Upload & Parsing**: Text extraction directly from PDF buffers with a 5MB size limit and strict MIME validation.
3. **SHA-256 Upload Deduplication**: Computes file hashes to prevent double processing and save AI token costs.
4. **Gemini AI ATS Matcher**: Compares qualifications, extracts missing keywords, defines skill roadmaps, and rewrites bullet points.
5. **N+1 SQL Optimization**: Uses SQLAlchemy eager `joinedload` queries to fetch records in a single database trip.
6. **SaaS Dashboard Interface**: Features circular SVG match dials, tabs for feedback, dark mode toggling, and responsive navigation.
7. **Rate Limiting**: Protects backend APIs (like file uploads) from abuse by limiting requests per IP address.

---

## Architecture
The platform is designed around a decoupled client-server architecture:
- **Client (Frontend):** A React Single Page Application (SPA) built with Vite, acting as the presentation layer. It communicates securely with the backend via RESTful APIs using JWT tokens.
- **Server (Backend):** A FastAPI asynchronous Python server that handles business logic, security, and integration with the Gemini AI service. 
- **Data Layer:** An SQLite/MySQL compatible relational database managed by SQLAlchemy (ORM) using asynchronous drivers (`aiosqlite`/`asyncmy`).
- **AI Integration:** Google Gemini provides the semantic matching intelligence required to compare unstructured PDF text against job descriptions.

---

## Tech Stack
- **Backend**: Python 3.11+, FastAPI (Asynchronous ASGI framework), SQLAlchemy 2.0 (ORM), Pydantic v2 (Validation & Schemas), PyPDF (Text extraction), and Cryptography/Bcrypt (Security).
- **Frontend**: React (Vite), Tailwind CSS v4 (Modern CSS-first styling), Lucide React (Icons), and Framer Motion (Transitions).
- **Containerization**: Docker & Docker Compose (Multi-stage Node-to-Nginx builds for frontend, slim Python images for backend).

---

## Setup Guide

### 1. Prerequisites
- Docker & Docker Compose installed OR
- Python 3.11+ and Node.js 20+ installed.
- A Google Gemini API Key (obtained from [Google AI Studio](https://aistudio.google.com/)).

### 2. Option A: Run via Docker Compose (Recommended)
1. Clone or navigate to the project directory.
2. Ensure you configure your environment variables in `backend/.env`. A sample configuration:
   ```env
   PROJECT_NAME="AI Resume Analyzer"
   SECRET_KEY="supersecret_jwt_sign_key"
   ALGORITHM="HS256"
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   DATABASE_URL="sqlite+aiosqlite:///./resume_analyzer.db"
   GEMINI_API_KEY="your_gemini_api_key_here"
   BACKEND_CORS_ORIGINS="http://localhost:3000,http://localhost:5173"
   ```
3. Launch the container orchestration:
   ```bash
   docker-compose up --build
   ```
4. Access the applications:
   - **Frontend UI**: [http://localhost:3000](http://localhost:3000)
   - **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Option B: Run Locally (Manual Setup)

**Backend:**
1. Open a terminal in the root directory and navigate to the backend folder: `cd backend`
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows: .\venv\Scripts\activate
   # On macOS/Linux: source venv/bin/activate
   ```
3. Install dependencies: `pip install -r requirements.txt`
4. Set up your `.env` file in `backend/` with the variables mentioned above.
5. Start the development server: `uvicorn app.main:app --reload`

**Frontend:**
1. Open a new terminal and navigate to the frontend folder: `cd frontend`
2. Install Node dependencies: `npm install`
3. Start the Vite React development server: `npm run dev`
4. Access the React app at [http://localhost:5173](http://localhost:5173).

---

## API Docs
The backend provides a fully documented Swagger UI available out-of-the-box via FastAPI.
- **Endpoint**: `/docs` (e.g., `http://localhost:8000/docs`)
- **Key Routes**:
  - `POST /api/v1/auth/login`: Issue JWT authentication tokens.
  - `POST /api/v1/auth/register`: Create a new user.
  - `POST /api/v1/resumes/upload`: Securely upload and parse a PDF resume.
  - `POST /api/v1/jobs/`: Save a target job description profile.
  - `POST /api/v1/analyzer/analyze`: Trigger the Gemini AI ATS matching engine.

---

## Deployment Links
- **Frontend Application (Vercel)**: *(Pending Deployment)*
- **Backend API (Railway)**: *(Pending Deployment)*
