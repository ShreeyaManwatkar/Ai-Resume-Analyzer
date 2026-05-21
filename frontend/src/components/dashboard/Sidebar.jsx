import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { 
  LayoutDashboard, 
  FileSearch, 
  History, 
  LogOut, 
  Sun, 
  Moon, 
  Sparkles,
  Menu,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Sidebar = ({ currentView, onViewChange }) => {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark" || 
    (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  // Apply dark class to root document element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "analyze", label: "Run Analysis", icon: FileSearch },
    { id: "history", label: "Analysis History", icon: History },
  ];

  const handleNavClick = (viewId) => {
    onViewChange(viewId);
    setMobileOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-dark-900 border-r border-slate-200 dark:border-dark-800 transition-colors duration-200">
      {/* Header / Brand Logo */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-dark-800/50">
        <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-primary-500/10">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-slate-900 dark:text-white leading-tight">ATS Core</h1>
          <span className="text-xs text-primary-600 dark:text-primary-400 font-semibold uppercase tracking-wider">AI Analyzer</span>
        </div>
      </div>

      {/* Main Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium transition-all duration-150 cursor-pointer ${
                isActive 
                  ? "bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-850 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-primary-600 dark:text-primary-400" : ""}`} />
              <span>{item.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="activeIndicator"
                  className="ml-auto w-1.5 h-1.5 bg-primary-600 dark:bg-primary-400 rounded-full"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer controls (Theme & Logout) */}
      <div className="p-4 border-t border-slate-100 dark:border-dark-800/50 space-y-4">
        {/* Dark/Light mode toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-850 cursor-pointer transition-colors"
        >
          {darkMode ? (
            <>
              <Sun className="w-5 h-5 text-amber-500" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-5 h-5 text-indigo-500" />
              <span>Dark Mode</span>
            </>
          )}
        </button>

        {/* User Card */}
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-100 dark:border-dark-850">
          <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg flex items-center justify-center font-bold text-sm">
            {user?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase() || "JD"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate leading-snug">
              {user?.full_name || "User Account"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 font-medium cursor-pointer transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-dark-900 border-b border-slate-200 dark:border-dark-800 w-full fixed top-0 left-0 z-30 transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-sm">ATS Core</span>
        </div>
        <button 
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 bg-slate-50 dark:bg-dark-850 rounded-lg text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Desktop Sidebar (Permanent) */}
      <div className="hidden md:block w-64 h-screen fixed top-0 left-0 z-20">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar (Slide-over drawer) */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 bg-black z-40"
            />
            {/* Drawer container */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="md:hidden fixed top-0 left-0 bottom-0 w-64 z-50 shadow-2xl"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
export default Sidebar;
