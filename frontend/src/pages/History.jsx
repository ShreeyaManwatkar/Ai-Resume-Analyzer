import React, { useState, useEffect } from "react";
import { useAuth, API_BASE_URL } from "../context/AuthContext";
import { FileText, Search, Calendar, ChevronRight, Award, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

export const History = ({ onSelectReport }) => {
  const { token } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchReports = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/analyzer/reports`, {
        headers: {
          Authorization: `Bearer {token}`, // Note: standard template string mapping
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (err) {
      console.error("Failed to load analysis history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [token]);

  const filteredReports = reports.filter(report => 
    report.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.resume_filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-1">
      {/* Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            Analysis Reports History
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review and track improvements across your entire job application scanning history.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search job title or file..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Reports Grid */}
      {filteredReports.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-dark-900/40 border border-slate-200 dark:border-dark-800 rounded-2xl">
          <FileText className="w-12 h-12 mx-auto text-slate-350 dark:text-dark-750 mb-3" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">No reports found</p>
          <p className="text-sm text-slate-400 mt-1">
            {searchTerm ? "No reports match your search criteria." : "You haven't run any resume analyses yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredReports.map((report, idx) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              onClick={() => onSelectReport(report.id)}
              className="p-5 bg-white dark:bg-dark-900/40 border border-slate-200 dark:border-dark-800 rounded-2xl flex items-center justify-between hover:border-primary-500/60 dark:hover:border-primary-500/50 hover:shadow-md cursor-pointer transition-all"
            >
              <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base truncate leading-snug">
                  {report.job_title}
                </h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 dark:text-slate-500">
                  <span className="truncate max-w-[180px]">File: {report.resume_filename}</span>
                  <span>•</span>
                  <span>{new Date(report.created_at).toLocaleDateString()} at {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Score Indicator */}
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end hidden sm:block">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">ATS Score</span>
                  <span className={`text-base font-extrabold ${
                    report.ats_score >= 80 
                      ? "text-emerald-500" 
                      : report.ats_score >= 60 
                        ? "text-amber-500" 
                        : "text-rose-500"
                  }`}>
                    {report.ats_score}% Match
                  </span>
                </div>

                <div className="relative w-12 h-12 flex items-center justify-center">
                  <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100 dark:text-dark-805"
                      strokeWidth="3.5"
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
                      strokeWidth="3.8"
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
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
export default History;
