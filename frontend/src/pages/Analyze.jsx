import React, { useState, useEffect } from "react";
import { useAuth, API_BASE_URL } from "../context/AuthContext";
import { 
  UploadCloud, 
  FileText, 
  Briefcase, 
  Sparkles, 
  AlertCircle, 
  ChevronRight, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Analyze = ({ onAnalysisComplete }) => {
  const { token } = useAuth();
  
  // Data loading states
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  
  // Selection states
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  
  // Form input states (for fresh upload/paste)
  const [uploadFile, setUploadFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  
  const [rawJdText, setRawJdText] = useState("");
  const [saveJd, setSaveJd] = useState(false);
  const [jdTitle, setJdTitle] = useState("");
  const [jdCompany, setJdCompany] = useState("");
  
  // Process execution states
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState("");
  const [error, setError] = useState("");
  
  // Results view state
  const [reportResult, setReportResult] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const headers = { Authorization: `Bearer ${token}` };

  // Fetch saved resources on mount
  useEffect(() => {
    fetchUserData();
  }, [token]);

  const fetchUserData = async () => {
    try {
      const [resumesRes, jobsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/resumes/`, { headers }),
        fetch(`${API_BASE_URL}/jobs/`, { headers }),
      ]);
      if (resumesRes.ok && jobsRes.ok) {
        const resumesData = await resumesRes.json();
        const jobsData = await jobsRes.json();
        setResumes(resumesData);
        setJobs(jobsData);
      }
    } catch (err) {
      console.error("Failed to load user resources:", err);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        setUploadFile(file);
        setSelectedResumeId(""); // Overwrite dropdown selection
      } else {
        setError("Only PDF resumes are supported.");
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
      setSelectedResumeId(""); // Overwrite dropdown selection
    }
  };

  // Run the full analysis request
  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError("");
    setReportResult(null);

    let finalResumeId = selectedResumeId;
    let finalJobId = selectedJobId || null;

    // 1. Validate inputs
    if (!finalResumeId && !uploadFile) {
      setError("Please select an uploaded resume or upload a new one.");
      return;
    }
    if (!finalJobId && !rawJdText.trim()) {
      setError("Please select a saved job profile or paste a job description.");
      return;
    }

    setIsAnalyzing(true);

    try {
      // 2. Perform File Upload first if a new file was chosen
      if (uploadFile) {
        setAnalysisStep("Uploading & Parsing PDF...");
        const formData = new FormData();
        formData.append("file", uploadFile);

        const uploadRes = await fetch(`${API_BASE_URL}/resumes/upload`, {
          method: "POST",
          headers,
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.detail || "Failed to upload resume.");
        }
        finalResumeId = uploadData.id;
        // Refresh resumes list in background
        fetchUserData();
        setUploadFile(null);
      }

      // 3. Save Job Description profile if checked
      if (!finalJobId && saveJd && rawJdText.trim()) {
        setAnalysisStep("Saving Job Description profile...");
        const saveJobRes = await fetch(`${API_BASE_URL}/jobs/`, {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: jdTitle || "Job Description Match",
            company: jdCompany || "Custom Company",
            description: rawJdText
          }),
        });

        const saveJobData = await saveJobRes.json();
        if (!saveJobRes.ok) {
          throw new Error(saveJobData.detail || "Failed to save job description.");
        }
        finalJobId = saveJobData.id;
        fetchUserData(); // refresh jobs dropdown
      }

      // 4. Trigger AI ATS analysis
      setAnalysisStep("Running Gemini ATS Matching Engine...");
      const analyzePayload = {
        resume_id: finalResumeId,
        ...(finalJobId ? { job_id: finalJobId } : { job_description: rawJdText }),
      };

      const analysisRes = await fetch(`${API_BASE_URL}/analyzer/analyze`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(analyzePayload),
      });

      const analysisData = await analysisRes.json();
      if (!analysisRes.ok) {
        throw new Error(analysisData.detail || "Failed to complete resume analysis.");
      }

      setReportResult(analysisData);
      setActiveTab("overview");
      if (onAnalysisComplete) {
        onAnalysisComplete();
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep("");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-1">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          ATS Scanner & Match Analyzer
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Perform high-fidelity semantic parsing and match scores of your resume against any job description.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold">Analysis Error: </span> {error}
          </div>
        </div>
      )}

      {/* Main Form/Selector Grid */}
      <AnimatePresence mode="wait">
        {!isAnalyzing && !reportResult && (
          <motion.form 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleAnalyze} 
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Left: Resume Section */}
            <div className="bg-white dark:bg-dark-900/40 border border-slate-200 dark:border-dark-800 p-6 rounded-2xl space-y-6 flex flex-col">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-base">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">1</span>
                  Select or Upload Resume
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Choose a previously uploaded file or upload a new PDF.</p>
              </div>

              {resumes.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Use Saved Resume
                  </label>
                  <select
                    value={selectedResumeId}
                    onChange={(e) => {
                      setSelectedResumeId(e.target.value);
                      if (e.target.value) setUploadFile(null); // clear uploaded file state
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">-- Choose saved resume --</option>
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.filename} ({new Date(r.created_at).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {resumes.length > 0 && (
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-100 dark:border-dark-800/80"></div>
                  <span className="flex-shrink mx-4 text-xs font-semibold text-slate-400 uppercase">OR</span>
                  <div className="flex-grow border-t border-slate-100 dark:border-dark-800/80"></div>
                </div>
              )}

              {/* Upload Drag and Drop zone */}
              <div className="flex-1 flex flex-col justify-center">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Upload New Resume (PDF Only)
                </label>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150 relative min-h-[180px] ${
                    isDragActive 
                      ? "border-primary-500 bg-primary-50/20 dark:bg-primary-950/15" 
                      : uploadFile 
                        ? "border-emerald-500 bg-emerald-50/5 dark:bg-emerald-950/5" 
                        : "border-slate-300 dark:border-dark-700 hover:border-primary-500 bg-slate-50/50 dark:bg-dark-950/30"
                  }`}
                  onClick={() => document.getElementById("resume-input-file").click()}
                >
                  <input
                    id="resume-input-file"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  {uploadFile ? (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                        <FileText className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm max-w-[200px] truncate mx-auto">
                        {uploadFile.name}
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Ready to parse
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-dark-850 text-slate-400 flex items-center justify-center mx-auto transition-colors group-hover:text-primary-500">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                        Drag & Drop or click to upload
                      </p>
                      <p className="text-xs text-slate-400">PDF format maximum size 10MB</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Job Description Section */}
            <div className="bg-white dark:bg-dark-900/40 border border-slate-200 dark:border-dark-800 p-6 rounded-2xl space-y-6 flex flex-col">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-base">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">2</span>
                  Select or Paste Job Description
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Provide details of the target role for comparison.</p>
              </div>

              {jobs.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Use Saved Job Profile
                  </label>
                  <select
                    value={selectedJobId}
                    onChange={(e) => {
                      setSelectedJobId(e.target.value);
                      if (e.target.value) setRawJdText(""); // clear typed text
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">-- Choose saved job description --</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title} {j.company ? `at ${j.company}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {jobs.length > 0 && (
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-100 dark:border-dark-800/80"></div>
                  <span className="flex-shrink mx-4 text-xs font-semibold text-slate-400 uppercase">OR</span>
                  <div className="flex-grow border-t border-slate-100 dark:border-dark-800/80"></div>
                </div>
              )}

              {/* Paste JD zone */}
              <div className="flex-1 flex flex-col">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Paste Raw Job Description requirements
                </label>
                <textarea
                  value={rawJdText}
                  onChange={(e) => {
                    setRawJdText(e.target.value);
                    if (e.target.value) setSelectedJobId(""); // clear dropdown choice
                  }}
                  placeholder="Paste the full job requirements, skills, and qualifications here..."
                  className="w-full flex-1 min-h-[160px] p-4 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm leading-relaxed"
                  disabled={!!selectedJobId}
                />
              </div>

              {/* Save Job options */}
              {!selectedJobId && rawJdText.trim().length > 10 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-3 pt-2"
                >
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveJd}
                      onChange={(e) => setSaveJd(e.target.checked)}
                      className="w-4 h-4 rounded text-primary-600 border-slate-350 dark:border-dark-800 focus:ring-primary-500"
                    />
                    Save this Job Description to library
                  </label>
                  
                  {saveJd && (
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={jdTitle}
                        onChange={(e) => setJdTitle(e.target.value)}
                        placeholder="Role Title (e.g. Node Dev)"
                        className="px-3.5 py-2 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                        required
                      />
                      <input
                        type="text"
                        value={jdCompany}
                        onChange={(e) => setJdCompany(e.target.value)}
                        placeholder="Company (e.g. Google)"
                        className="px-3.5 py-2 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Submition Button row */}
            <div className="lg:col-span-2 flex justify-center py-2">
              <button
                type="submit"
                className="px-8 py-3.5 bg-primary-600 hover:bg-primary-550 active:bg-primary-750 text-white rounded-xl font-bold shadow-lg shadow-primary-600/10 hover:shadow-primary-600/20 transition-all flex items-center gap-2 text-base cursor-pointer"
              >
                <Sparkles className="w-5 h-5" />
                Analyze Resume Match
              </button>
            </div>
          </motion.form>
        )}

        {/* Loader Screen */}
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center min-h-[450px]"
          >
            {/* Spinning orbital loading icons */}
            <div className="relative w-20 h-20 mb-8 flex items-center justify-center">
              <div className="absolute w-full h-full border-4 border-primary-100 dark:border-dark-850 rounded-full"></div>
              <div className="absolute w-full h-full border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              <Sparkles className="w-7 h-7 text-primary-500 animate-pulse" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white animate-pulse">
              Running AI ATS Check
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mt-2 font-medium">
              {analysisStep}
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs text-slate-400 bg-slate-100 dark:bg-dark-900 px-3.5 py-1.5 rounded-full">
              <Clock className="w-4 h-4" /> This typically takes about 3 - 5 seconds
            </div>
          </motion.div>
        )}

        {/* Analysis Results View */}
        {reportResult && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Top Score Banner Card */}
            <div className="p-6 bg-white dark:bg-dark-900/40 border border-slate-200 dark:border-dark-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 text-xs font-bold bg-primary-100 dark:bg-primary-950/40 text-primary-700 dark:text-primary-400 rounded-full uppercase tracking-wider">
                    ATS Audit Completed
                  </span>
                  <button 
                    onClick={() => {
                      setReportResult(null);
                      setUploadFile(null);
                    }}
                    className="text-xs text-slate-400 dark:text-slate-500 hover:text-primary-500 hover:underline cursor-pointer ml-auto md:ml-0"
                  >
                    Analyze another file
                  </button>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                  {reportResult.job_title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Targeted Resume: <span className="font-semibold text-slate-700 dark:text-slate-300">{reportResult.resume_filename}</span> • Analyzed on {new Date(reportResult.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Large Score Dial */}
              <div className="flex items-center gap-5">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100 dark:text-dark-850"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={`animate-gauge ${
                        reportResult.ats_score >= 80 
                          ? "text-emerald-500" 
                          : reportResult.ats_score >= 60 
                            ? "text-amber-500" 
                            : "text-rose-500"
                      }`}
                      strokeWidth="3.8"
                      strokeDasharray={`${reportResult.ats_score}, 100`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {reportResult.ats_score}%
                  </span>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Match rating</p>
                  <p className="text-xs text-slate-400 max-w-[120px]">
                    {reportResult.ats_score >= 80 
                      ? "Excellent fit. High likelihood of passing automated screenings." 
                      : reportResult.ats_score >= 60 
                        ? "Good fit. Try filling key skill gaps to reach 80%." 
                        : "Low match. We recommend optimizing missing keywords."}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs control */}
            <div className="border-b border-slate-200 dark:border-dark-800 flex gap-2 overflow-x-auto pb-px">
              {[
                { id: "overview", label: "Overview" },
                { id: "keywords", label: "Keywords Gap" },
                { id: "skills", label: "Skill gaps" },
                { id: "bullets", label: "Bullet Rewrites" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-colors focus:outline-none ${
                    activeTab === tab.id
                      ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                      : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tabs content rendering */}
            <div className="min-h-[200px]">
              {activeTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Formatting critic card */}
                  <div className="md:col-span-2 bg-white dark:bg-dark-900/30 border border-slate-200 dark:border-dark-800 p-6 rounded-2xl space-y-4">
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">ATS Formatting Feedback</h4>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-line">
                      {reportResult.analysis_payload.formatting_feedback}
                    </p>
                  </div>
                  {/* Summary card */}
                  <div className="bg-white dark:bg-dark-900/30 border border-slate-200 dark:border-dark-800 p-6 rounded-2xl space-y-4 h-fit">
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">Analysis Summary</h4>
                    <div className="space-y-3.5 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex justify-between border-b border-slate-100 dark:border-dark-800/80 pb-2">
                        <span>Keywords Matched</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {reportResult.analysis_payload.keywords_matched.length}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 dark:border-dark-800/80 pb-2">
                        <span>Keywords Missing</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {reportResult.analysis_payload.keywords_missing.length}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 dark:border-dark-800/80 pb-2">
                        <span>Bullet Suggestions</span>
                        <span className="font-bold text-primary-600 dark:text-primary-400">
                          {reportResult.analysis_payload.bullet_point_improvements.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "keywords" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Matched Keywords */}
                  <div className="bg-white dark:bg-dark-900/30 border border-slate-200 dark:border-dark-800 p-6 rounded-2xl space-y-4">
                    <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      Matched Keywords ({reportResult.analysis_payload.keywords_matched.length})
                    </h4>
                    {reportResult.analysis_payload.keywords_matched.length === 0 ? (
                      <p className="text-xs text-slate-400">No matched keywords found.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {reportResult.analysis_payload.keywords_matched.map((kw) => (
                          <span 
                            key={kw} 
                            className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-semibold rounded-lg text-xs"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Missing Keywords */}
                  <div className="bg-white dark:bg-dark-900/30 border border-slate-200 dark:border-dark-800 p-6 rounded-2xl space-y-4">
                    <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-amber-500" />
                      Missing Keywords ({reportResult.analysis_payload.keywords_missing.length})
                    </h4>
                    {reportResult.analysis_payload.keywords_missing.length === 0 ? (
                      <p className="text-xs text-slate-400 text-emerald-600 dark:text-emerald-400 font-medium">All requested keywords were matched! Great job!</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {reportResult.analysis_payload.keywords_missing.map((kw) => (
                          <span 
                            key={kw} 
                            className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 font-semibold rounded-lg text-xs"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "skills" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {reportResult.analysis_payload.skill_gap_analysis.map((gap, idx) => (
                    <div 
                      key={idx}
                      className="bg-white dark:bg-dark-900/30 border border-slate-200 dark:border-dark-800 p-5 rounded-2xl space-y-3 shadow-sm flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">{gap.skill}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            gap.severity === "High" 
                              ? "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400"
                              : gap.severity === "Medium"
                                ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
                                : "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400"
                          }`}>
                            {gap.severity} Priority
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {gap.recommendation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "bullets" && (
                <div className="bg-white dark:bg-dark-900/30 border border-slate-200 dark:border-dark-800 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 dark:bg-dark-950 border-b border-slate-200 dark:border-dark-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          <th className="p-4 w-1/3">Original Bullet Point</th>
                          <th className="p-4 w-1/3">AI Optimized (STAR Method)</th>
                          <th className="p-4 w-1/3">Rationale & Strategy</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-dark-800 text-sm">
                        {reportResult.analysis_payload.bullet_point_improvements.map((bullet, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/30 dark:hover:bg-dark-950/20">
                            <td className="p-4 text-xs font-medium text-red-600 dark:text-red-400/90 align-top leading-relaxed">
                              "{bullet.original}"
                            </td>
                            <td className="p-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 align-top leading-relaxed">
                              "{bullet.improved}"
                            </td>
                            <td className="p-4 text-xs text-slate-500 dark:text-slate-400 align-top leading-relaxed">
                              {bullet.rationale}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default Analyze;
