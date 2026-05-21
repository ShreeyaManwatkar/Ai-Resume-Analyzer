import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Sidebar } from "./components/dashboard/Sidebar";
import { Dashboard } from "./pages/Dashboard";
import { Analyze } from "./pages/Analyze";
import { History } from "./pages/History";
import { ReportDetails } from "./pages/ReportDetails";
import { motion, AnimatePresence } from "framer-motion";

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [authView, setAuthView] = useState("login"); // login | register
  const [view, setView] = useState("dashboard"); // dashboard | analyze | history | report_details
  const [selectedReportId, setSelectedReportId] = useState(null);

  // Spinner when initializing token authentication on mount
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-950 transition-colors duration-200">
        <div className="relative w-12 h-12 flex items-center justify-center">
          <div className="absolute w-full h-full border-4 border-primary-100 dark:border-dark-850 rounded-full"></div>
          <div className="absolute w-full h-full border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Non-authenticated layout (Login / Sign-up switches)
  if (!isAuthenticated) {
    return authView === "login" ? (
      <Login onSwitchToRegister={() => setAuthView("register")} />
    ) : (
      <Register onSwitchToLogin={() => setAuthView("login")} />
    );
  }

  const handleSelectReport = (reportId) => {
    setSelectedReportId(reportId);
    setView("report_details");
  };

  // Main Dashboard Shell layout
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-dark-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Sidebar - navigates between dashboard, analyze and history */}
      <Sidebar 
        currentView={view === "report_details" ? "history" : view} 
        onViewChange={setView} 
      />
      
      {/* Dashboard Main Workspace Container */}
      <main className="flex-1 px-4 py-6 md:p-8 md:ml-64 mt-14 md:mt-0 transition-all duration-200">
        <div className="max-w-5xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={view + (selectedReportId || "")}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
            >
              {view === "dashboard" && (
                <Dashboard 
                  onViewChange={setView} 
                  onSelectReport={handleSelectReport} 
                />
              )}
              {view === "analyze" && (
                <Analyze 
                  onAnalysisComplete={() => setView("history")} 
                />
              )}
              {view === "history" && (
                <History 
                  onSelectReport={handleSelectReport} 
                />
              )}
              {view === "report_details" && (
                <ReportDetails 
                  reportId={selectedReportId} 
                  onBack={() => setView("history")} 
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
