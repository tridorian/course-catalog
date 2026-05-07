
import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  CheckCircle2,
  Lock,
  AlertTriangle
} from 'lucide-react';

import ModuleRenderer from './components/ModuleRenderer';
import { fetchCourseManifest, fetchCourseMetadata, fetchModuleContent } from './services/contentLoader';

// --- Main App Component ---

export default function App() {
  const [courseMetadata, setCourseMetadata] = useState(null);
  const [courseSteps, setCourseSteps] = useState([]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [completedSteps, setCompletedSteps] = useState([0]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Parse trackId and courseId from URL hash: #/trackId/courseId
  const getRouteParams = () => {
    const hash = window.location.hash.replace(/^#\//, '');
    const parts = hash.split('/');
    if (parts.length >= 2) {
      return { trackId: parts[0], courseId: parts[1] };
    }
    // Default or fallback
    return { trackId: 'agentic-engineering', courseId: 'agv-01' };
  };

  const { trackId, courseId } = getRouteParams();

  // Load course manifest and metadata
  useEffect(() => {
    async function loadCourse() {
      setIsLoading(true);
      setError(null);
      try {
        const manifest = await fetchCourseManifest(trackId, courseId);
        const metadata = await fetchCourseMetadata(trackId, courseId, manifest.metadata);
        setCourseMetadata(metadata);

        // Load all module content
        const stepPromises = manifest.modules.map((mod) =>
          fetchModuleContent(trackId, courseId, mod.file)
        );

        const steps = await Promise.all(stepPromises);
        setCourseSteps(steps);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load course content:", err);
        setError(err.message);
        setIsLoading(false);
      }
    }

    loadCourse();
  }, [trackId, courseId]);

  // Listen for hash changes to support navigation
  useEffect(() => {
    const handleHashChange = () => {
      // Re-render will trigger loadCourse because trackId/courseId will change
      // However, we might want to reset state
      setActiveStepIndex(0);
      setCompletedSteps([0]);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const activeStep = courseSteps[activeStepIndex];
  const totalSteps = courseSteps.length;
  const progressPercentage = totalSteps > 0 ? (completedSteps.length / totalSteps) * 100 : 0;

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050805] flex items-center justify-center">
        <div className="text-[#4ade80] font-mono animate-pulse text-xl tracking-widest">
          LOADING TRIDORIAN MISSION...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050805] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#0a120c] border border-red-900/50 rounded-lg p-8 text-center shadow-[0_0_30px_rgba(220,38,38,0.1)]">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-500 mb-2 uppercase tracking-tighter">Mission Interrupted</h2>
          <p className="text-gray-400 font-mono text-sm mb-6">{error}</p>
          <button
            onClick={() => window.location.hash = '#/agentic-engineering/agv-01'}
            className="px-6 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded font-mono text-xs transition-all"
          >
            RETURN TO BASE (AGV-01)
          </button>
        </div>
      </div>
    );
  }

  if (!activeStep) {
    return (
      <div className="min-h-screen bg-[#050805] flex items-center justify-center">
        <div className="text-red-500 font-mono text-xl tracking-widest">
          ERROR: MISSION CONTENT NOT FOUND.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050805] text-[#f0fdf4] font-sans flex flex-col md:flex-row selection:bg-[#4ade80] selection:text-black">

      {/* Mobile Header */}
      <div className="md:hidden bg-[#0a120c] border-b border-[#1f3d25] p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="font-bold text-[#4ade80] tracking-widest">TRIDORIAN</div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-[#f0fdf4]">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
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
          <div className="text-xs text-[#86efac] mt-1 font-mono uppercase">{courseMetadata?.title || 'LABS // UNKNOWN'}</div>
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
                  key={step.id || index}
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
            <span>Progress</span>
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
          {/* Step Indicator */}
          <div className="mb-8 flex items-center justify-between">
            <div className="text-xs font-mono text-[#86efac] tracking-widest uppercase">
              Module {activeStepIndex + 1} <span className="opacity-30 mx-2">//</span> {activeStep.title.replace(/^\d+\.\s*/, '')}
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
          <ModuleRenderer module={activeStep} />
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
