import React, { useState, useEffect } from "react";
import { useAuth, API_BASE_URL } from "../context/AuthContext";
import { 
  FileText, 
  Briefcase, 
  Award, 
  TrendingUp, 
  ArrowRight,
  Plus,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";

export const Dashboard = ({ onViewChange, onSelectReport }) => {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    resumesCount: 0,
    jobsCount: 0,
    reportsCount: 0,
    averageScore: 0,
  });
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch reports, resumes, and jobs concurrently
        const [resumesRes, jobsRes, reportsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/resumes/`, { headers }),
          fetch(`${API_BASE_URL}/jobs/`, { headers }),
          fetch(`${API_BASE_URL}/analyzer/reports`, { headers }),
        ]);

        if (resumesRes.ok && jobsRes.ok && reportsRes.ok) {
          const resumes = await resumesRes.json();
          const jobs = await jobsRes.json();
          const reports = await reportsRes.json();

          // Calculate average score
          const totalScore = reports.reduce((acc, r) => acc + r.ats_score, 0);
          const avgScore = reports.length > 0 ? Math.round(totalScore / reports.length) : 0;

          setStats({
            resumesCount: resumes.length,
            jobsCount: jobs.length,
            reportsCount: reports.length,
            averageScore: avgScore,
          });

          // Grab the 3 most recent reports
          setRecentReports(reports.slice(0, 3));
        }
      } catch (error) {
        console.error("Error fetching dashboard statistics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  const cards = [
    {
      title: "Resumes Uploaded",
      value: stats.resumesCount,
      icon: FileText,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30",
    },
    {
      title: "Saved Job Profiles",
      value: stats.jobsCount,
      icon: Briefcase,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30",
    },
    {
      title: "ATS Scans Run",
      value: stats.reportsCount,
      icon: Award,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/30",
    },
    {
      title: "Average Match Score",
      value: `${stats.averageScore}%`,
      icon: TrendingUp,
      color: "text-primary-600 dark:text-primary-400",
      bg: "bg-primary-50 dark:bg-primary-950/20 border-primary-100 dark:border-primary-900/30",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-1">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-750 dark:to-indigo-850 p-6 md:p-8 rounded-2xl text-white shadow-xl shadow-primary-900/10">
        <div className="space-y-1.5">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            Accelerate Your Job Search <Sparkles className="w-6 h-6 animate-pulse text-amber-300" />
          </h2>
          <p className="text-primary-100 text-sm max-w-xl">
            Upload your resumes, save target job descriptions, and use Gemini AI analysis to optimize your resume bullets and bridge critical skill gaps.
          </p>
        </div>
        <button
          onClick={() => onViewChange("analyze")}
          className="flex items-center gap-2 px-5 py-3 bg-white text-primary-700 hover:bg-slate-50 active:bg-slate-100 rounded-xl font-semibold shadow-md transition-all self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-5 h-5 text-primary-700" />
          New ATS Check
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-6 border rounded-2xl flex items-center justify-between shadow-sm bg-white dark:bg-dark-900/50 ${card.bg}`}
            >
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {card.title}
                </span>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  {card.value}
                </p>
              </div>
              <div className={`p-3 rounded-xl bg-white dark:bg-dark-950/60 shadow-sm ${card.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Scans & Info Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Reports List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Analyses</h3>
            {stats.reportsCount > 3 && (
              <button 
                onClick={() => onViewChange("history")}
                className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                View all history <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {recentReports.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-dark-900/40 border border-slate-200 dark:border-dark-800 rounded-2xl">
              <FileText className="w-12 h-12 mx-auto text-slate-300 dark:text-dark-700 mb-3" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No scans run yet</p>
              <p className="text-sm text-slate-400 mt-1">Upload a resume and paste a job description to see your first report.</p>
              <button
                onClick={() => onViewChange("analyze")}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-xl text-sm shadow hover:bg-primary-500 cursor-pointer"
              >
                Get Started
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentReports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => onSelectReport(report.id)}
                  className="p-5 bg-white dark:bg-dark-900/40 border border-slate-200 dark:border-dark-800 rounded-2xl flex items-center justify-between hover:border-primary-500/60 dark:hover:border-primary-500/50 hover:shadow-md cursor-pointer transition-all"
                >
                  <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate text-base leading-snug">
                      {report.job_title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 dark:text-slate-500">
                      <span className="truncate max-w-[150px]">File: {report.resume_filename}</span>
                      <span>•</span>
                      <span>{new Date(report.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {/* Circular Match score badge */}
                  <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 flex items-center justify-center">
                      <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-100 dark:text-dark-800"
                          strokeWidth="3"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className={`${
                            report.ats_score >= 80 
                              ? "text-emerald-500" 
                              : report.ats_score >= 60 
                                ? "text-amber-500" 
                                : "text-rose-500"
                          }`}
                          strokeWidth="3.5"
                          strokeDasharray={`${report.ats_score}, 100`}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {report.ats_score}%
                      </span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 hidden sm:block" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Tips panel */}
        <div className="bg-white dark:bg-dark-900/30 border border-slate-200 dark:border-dark-800 p-6 rounded-2xl space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">ATS Interview Tips</h3>
          <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex gap-2">
              <span className="font-bold text-primary-600">•</span>
              <span><strong>Keywords Matter:</strong> Recruiter scanning software ranks candidates by counting intersections of job keywords. Prioritize target terminology.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-primary-600">•</span>
              <span><strong>Quantify Impact:</strong> Do not just list duties. Use numerical indicators (revenue saved, speed percentages) to prove results.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-primary-600">•</span>
              <span><strong>PDF formatting:</strong> Scanned image PDFs cannot be indexed. Ensure you always export text-selectable documents.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
