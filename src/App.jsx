import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  LogOut,
  Cloud,
  CloudOff,
  RefreshCw,
  User,
  Lock,
  CheckCircle2
} from 'lucide-react';
import courseData from './content/course.json';
import ContentRenderer from './components/ContentRenderer';
import { initGoogleAuth, signIn, signOut, getAccessToken } from './services/googleAuth';
import { getProgressFile, saveProgress } from './services/googleDrive';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function App() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [driveFileId, setDriveFileId] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  const [completedSteps, setCompletedSteps] = useState([0]);

  const courseSteps = courseData.steps;
  const activeStep = courseSteps[activeStepIndex];
  const totalSteps = courseSteps.length;
  const progressPercentage = (completedSteps.length / totalSteps) * 100;

  // Initialize Google Auth
  useEffect(() => {
    if (CLIENT_ID) {
      initGoogleAuth(CLIENT_ID).catch(console.error);
    }
  }, []);

  // Handle Login
  const handleLogin = async () => {
    try {
      await signIn();
      setIsAuthenticated(true);
      await loadProgressFromDrive();
    } catch (err) {
      console.error('Login failed', err);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    signOut();
    setIsAuthenticated(false);
    setDriveFileId(null);
  };

  // Load Progress
  const loadProgressFromDrive = useCallback(async () => {
    setIsSyncing(true);
    try {
      const file = await getProgressFile();
      setDriveFileId(file.id);
      if (file.appProperties && file.appProperties.activeStepIndex) {
        const index = parseInt(file.appProperties.activeStepIndex, 10);
        if (!isNaN(index) && index >= 0 && index < totalSteps) {
          setActiveStepIndex(index);
          // Reconstruct completed steps up to this index
          const completed = Array.from({ length: index + 1 }, (_, i) => i);
          setCompletedSteps(completed);
          setLastSynced(new Date());
        }
      }
    } catch (err) {
      console.error('Failed to load progress', err);
    } finally {
      setIsSyncing(false);
    }
  }, [totalSteps]);

  // Save Progress
  const syncProgress = useCallback(async (index) => {
    if (!isAuthenticated || !driveFileId) return;

    setIsSyncing(true);
    try {
      await saveProgress(driveFileId, index);
      setLastSynced(new Date());
    } catch (err) {
      console.error('Failed to sync progress', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated, driveFileId]);

  // Effect to sync when step changes
  useEffect(() => {
    if (isAuthenticated && driveFileId) {
      const timer = setTimeout(() => {
        syncProgress(activeStepIndex);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [activeStepIndex, isAuthenticated, driveFileId, syncProgress]);

  // Scroll to top when step changes
  useEffect(() => {
    if (activeStepIndex !== 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeStepIndex]);

  const goToNext = () => {
    if (activeStepIndex < totalSteps - 1) {
      const nextIndex = activeStepIndex + 1;
      setActiveStepIndex(nextIndex);
      if (!completedSteps.includes(nextIndex)) {
        setCompletedSteps(prev => [...prev, nextIndex]);
      }
    }
  };

  const goToPrev = () => {
    if (activeStepIndex > 0) {
      setActiveStepIndex(activeStepIndex - 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#050805] text-[#f0fdf4] font-sans flex flex-col md:flex-row selection:bg-[#4ade80] selection:text-black">

      {/* Mobile Header */}
      <div className="md:hidden bg-[#0a120c] border-b border-[#1f3d25] p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="font-bold text-[#4ade80] tracking-widest">TRIDORIAN</div>
        <div className="flex items-center gap-4">
           {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {isSyncing ? <RefreshCw size={16} className="animate-spin text-[#4ade80]" /> : <Cloud size={16} className="text-[#4ade80]" />}
            </div>
          ) : <CloudOff size={16} className="text-gray-500" />}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-[#f0fdf4]">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <div className={`
        ${isMobileMenuOpen ? 'block' : 'hidden'}
        md:block fixed md:sticky top-[61px] md:top-0 h-[calc(100vh-61px)] md:h-screen
        w-full md:w-80 bg-[#0a120c] border-r border-[#1f3d25] flex flex-col z-40
        transition-all duration-300 ease-in-out overflow-y-auto custom-scrollbar
      `}>
        <div className="p-6 hidden md:block border-b border-[#1f3d25]">
          <div className="font-extrabold text-xl text-[#4ade80] tracking-[0.2em]">TRIDORIAN</div>
          <div className="text-xs text-[#86efac] mt-1 font-mono">LABS // AGV-01</div>
        </div>

        {/* Google Auth Section */}
        <div className="p-4 border-b border-[#1f3d25] bg-[#0a120c]/50">
          {isAuthenticated ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[#4ade80]">
                  <User size={14} />
                  <span>Authenticated</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-white transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={14} />
                </button>
              </div>
              <div className="flex items-center justify-between bg-[#132617] p-2 rounded border border-[#1f3d25]">
                <div className="flex items-center gap-2 text-xs text-[#86efac]">
                  {isSyncing ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      <span>Syncing...</span>
                    </>
                  ) : (
                    <>
                      <Cloud size={12} />
                      <span>Drive Synced</span>
                    </>
                  )}
                </div>
                {lastSynced && (
                  <span className="text-[10px] text-gray-500">
                    {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="w-full bg-white text-black hover:bg-gray-200 transition-colors py-2 px-4 rounded font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            >
              <img src="https://www.google.com/favicon.ico" alt="G" className="w-4 h-4" />
              Sign in with Google
            </button>
          )}
        </div>

        <div className="p-4 flex-1">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Course Modules</h2>
          <nav className="space-y-2">
            {courseSteps.map((step, index) => {
              const isCompleted = completedSteps.includes(index);
              const isActive = index === activeStepIndex;
              const isLocked = index > 0 && !completedSteps.includes(index - 1) && !isCompleted;

              return (
                <button
                  key={step.id}
                  disabled={isLocked}
                  onClick={() => {
                    setActiveStepIndex(index);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex justify-between items-center group relative ${
                    isActive
                      ? 'bg-[#132617] text-[#4ade80] border border-[#1f3d25] shadow-[0_0_15px_rgba(74,222,128,0.1)]'
                      : isLocked
                        ? 'text-gray-600 cursor-not-allowed opacity-50'
                        : 'text-gray-400 hover:bg-[#132617]/50 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    {isLocked ? (
                      <Lock size={14} className="text-gray-600" />
                    ) : isCompleted ? (
                      <CheckCircle2 size={14} className="text-[#4ade80]" />
                    ) : (
                      <div className={`w-3.5 h-3.5 rounded-full border ${isActive ? 'border-[#4ade80] animate-pulse' : 'border-gray-500'}`}></div>
                    )}
                    <span className="truncate">{step.title}</span>
                  </div>
                  <span className="text-[10px] opacity-40 whitespace-nowrap font-mono">{step.duration}</span>

                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#4ade80] rounded-r-full shadow-[0_0_8px_#4ade80]"></div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Global Progress */}
        <div className="p-6 border-t border-[#1f3d25] bg-[#050805]">
          <div className="flex justify-between text-xs text-[#86efac] mb-2">
            <span>Overall Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="h-2 w-full bg-[#132617] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#4ade80] transition-all duration-500 ease-out shadow-[0_0_10px_#4ade80]"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden pb-24 md:pb-0">

        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#4ade80]/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>

        <main className="flex-1 p-6 md:p-12 lg:p-16 max-w-4xl mx-auto w-full z-10">
          {/* Module Progress Header */}
          <div className="mb-8 flex items-center justify-between">
          <div className="text-xs font-mono text-[#86efac] tracking-widest uppercase flex items-center gap-2">
            <span>Module {activeStepIndex + 1} <span className="opacity-30 mx-2">//</span> {activeStep.title.replace(/^\d+\.\s*/, '')}</span>
            {activeStep.optional && (
              <span className="bg-[#1f3d25] text-[#4ade80] text-[10px] px-2 py-0.5 rounded border border-[#4ade80]/30 font-bold">OPTIONAL</span>
            )}
            </div>
            <div className="text-[10px] font-mono text-gray-500">
              {activeStepIndex + 1} / {totalSteps}
            </div>
          </div>

          <div className="h-1 w-full bg-[#132617] rounded-full overflow-hidden mb-12">
            <div
              className="h-full bg-gradient-to-r from-[#1f3d25] to-[#4ade80] transition-all duration-700 ease-in-out"
              style={{ width: `${((activeStepIndex + 1) / totalSteps) * 100}%` }}
            ></div>
          </div>

          {/* Inject Content */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <ContentRenderer blocks={activeStep.blocks} />
          </div>
        </main>

        {/* Bottom Navigation Bar */}
        <footer className="fixed md:sticky bottom-0 w-full md:w-auto bg-[#0a120c] border-t border-[#1f3d25] p-4 px-6 md:px-12 flex justify-between items-center z-30">
          <button
            onClick={goToPrev}
            disabled={activeStepIndex === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeStepIndex === 0
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-white hover:bg-[#132617]'
            }`}
          >
            <ChevronLeft size={20} />
            Back
          </button>

          <button
            onClick={goToNext}
            disabled={activeStepIndex === totalSteps - 1}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${
              activeStepIndex === totalSteps - 1
                ? 'opacity-0 pointer-events-none'
                : 'bg-[#4ade80] text-black hover:bg-[#22c55e] shadow-[0_0_15px_rgba(74,222,128,0.3)]'
            }`}
          >
            Next
            <ChevronRight size={20} />
          </button>
        </footer>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        /* Custom Scrollbar for sidebar to match theme */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0a120c;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1f3d25;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4ade80;
        }
      `}} />
    </div>
  );
}
