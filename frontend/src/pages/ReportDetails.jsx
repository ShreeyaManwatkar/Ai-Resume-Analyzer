import React, { useState, useEffect } from "react";
import { useAuth, API_BASE_URL } from "../context/AuthContext";
import { 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  XCircle,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";

export const ReportDetails = ({ reportId, onBack }) => {
  const { token } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchReportDetail = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/analyzer/reports/${reportId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setReport(data);
        }
      } catch (err) {
        console.error("Failed to load report detail:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportDetail();
  }, [reportId, token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center p-8 bg-white dark:bg-dark-900/40 border border-slate-200 dark:border-dark-800 rounded-2xl max-w-md mx-auto mt-12">
        <p className="font-bold text-slate-700 dark:text-slate-350">Report not found</p>
        <p className="text-sm text-slate-400 mt-1">This analysis record may have been deleted or is inaccessible.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold"
        >
          Back to list
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-1">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 font-semibold cursor-pointer group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to history
      </button>

      {/* Top Banner Card */}
      <div className="p-6 bg-white dark:bg-dark-900/40 border border-slate-200 dark:border-dark-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 flex-1">
          <span className="px-3 py-1 text-xs font-bold bg-primary-100 dark:bg-primary-950/40 text-primary-700 dark:text-primary-400 rounded-full uppercase tracking-wider">
            Analysis Report Detail
          </span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
            {report.job_title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Targeted Resume: <span className="font-semibold text-slate-700 dark:text-slate-300">{report.resume_filename}</span> • Analyzed on {new Date(report.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Score Dial */}
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
                  report.ats_score >= 80 
                    ? "text-emerald-500" 
                    : report.ats_score >= 60 
                      ? "text-amber-500" 
                      : "text-rose-500"
                }`}
                strokeWidth="3.8"
                strokeDasharray={`${report.ats_score}, 100`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {report.ats_score}%
            </span>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Match rating</p>
            <p className="text-xs text-slate-400 max-w-[120px]">
              {report.ats_score >= 80 
                ? "Excellent fit. High likelihood of passing automated screenings." 
                : report.ats_score >= 60 
                  ? "Good fit. Try filling key skill gaps to reach 80%." 
                  : "Low match. We recommend optimizing missing keywords."}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
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

      {/* Tabs Content */}
      <div className="min-h-[200px]">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 bg-white dark:bg-dark-900/30 border border-slate-200 dark:border-dark-800 p-6 rounded-2xl space-y-4">
              <h4 className="font-bold text-slate-900 dark:text-white text-base">ATS Formatting Feedback</h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-line">
                {report.analysis_payload.formatting_feedback}
              </p>
            </div>
            <div className="bg-white dark:bg-dark-900/30 border border-slate-200 dark:border-dark-800 p-6 rounded-2xl space-y-4 h-fit">
              <h4 className="font-bold text-slate-900 dark:text-white text-base">Analysis Summary</h4>
              <div className="space-y-3.5 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex justify-between border-b border-slate-100 dark:border-dark-800/80 pb-2">
                  <span>Keywords Matched</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {report.analysis_payload.keywords_matched.length}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-dark-800/80 pb-2">
                  <span>Keywords Missing</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {report.analysis_payload.keywords_missing.length}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-dark-800/80 pb-2">
                  <span>Bullet Suggestions</span>
                  <span className="font-bold text-primary-600 dark:text-primary-400">
                    {report.analysis_payload.bullet_point_improvements.length}
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
                Matched Keywords ({report.analysis_payload.keywords_matched.length})
              </h4>
              {report.analysis_payload.keywords_matched.length === 0 ? (
                <p className="text-xs text-slate-400">No matched keywords found.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {report.analysis_payload.keywords_matched.map((kw) => (
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
                Missing Keywords ({report.analysis_payload.keywords_missing.length})
              </h4>
              {report.analysis_payload.keywords_missing.length === 0 ? (
                <p className="text-xs text-slate-400 text-emerald-600 dark:text-emerald-400 font-medium">All requested keywords were matched! Great job!</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {report.analysis_payload.keywords_missing.map((kw) => (
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
            {report.analysis_payload.skill_gap_analysis.map((gap, idx) => (
              <div 
                key={idx}
                className="bg-white dark:bg-dark-900/30 border border-slate-200 dark:border-dark-800 p-5 rounded-2xl space-y-3 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-850 dark:text-slate-100 text-base">{gap.skill}</h4>
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
                  {report.analysis_payload.bullet_point_improvements.map((bullet, idx) => (
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
    </div>
  );
};
export default ReportDetails;
