
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import {
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  CheckCircle2,
  Lock,
  AlertTriangle,
  Trophy,
  History,
  CheckCircle,
  HelpCircle,
  ArrowDown
} from 'lucide-react';

import ModuleRenderer from './components/ModuleRenderer';
import SyncStatus from './components/SyncStatus';
import Dashboard from './components/Dashboard';
import TrackPage from './components/TrackPage';
import AdminPanel from './components/AdminPanel';
import HelpSection from './components/HelpSection';
import { fetchCourseManifest, fetchCourseMetadata, fetchModuleContent } from './services/contentLoader';
import * as contentLoaderService from './services/contentLoader';
import { checkUserRole } from './services/roleManager';
import { loadProgress, saveCourseProgress, syncOfflineQueue } from './services/googleDrive';
import { getAccessToken } from './services/googleAuth';
import GlobalControls from './components/GlobalControls';
import { useTheme } from './hooks/useTheme';
import * as themeAudio from './services/themeAudio';
import BadgeCelebration from './components/BadgeCelebration';
import { extractQuizQuestions } from './services/quizParser';
import { saveCustomTheme } from './services/customTheme';

// --- Main App Component ---

function AppContent({ theme, setTheme }) {
  const [courseMetadata, setCourseMetadata] = useState(null);
  const [courseSteps, setCourseSteps] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [syncStatus, setSyncStatus] = useState('synced');
  const [driveFileId, setDriveFileId] = useState(null);
  const [resumeSession, setResumeSession] = useState(null);
  const [isResumeBannerVisible, setIsResumeBannerVisible] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [activeStepQuizPassed, setActiveStepQuizPassed] = useState(true);
  const [trackManifest, setTrackManifest] = useState(null);
  const [userRole, setUserRole] = useState('student');


  const { trackId, courseId, moduleId } = useParams();
  const navigate = useNavigate();

  const currentTrackId = trackId;
  const currentCourseId = courseId;

  // Handle offline queue sync when connection is restored
  useEffect(() => {
    const handleOnline = () => {
      syncOfflineQueue();
    };
    window.addEventListener('online', handleOnline);
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      syncOfflineQueue();
    }
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Load course manifest, metadata, and progress
  useEffect(() => {
    async function loadCourse() {
      setIsLoading(true);
      setError(null);
      try {
        const manifest = await fetchCourseManifest(currentTrackId, currentCourseId);
        const metadata = await fetchCourseMetadata(currentTrackId, currentCourseId, manifest.metadata);
        setCourseMetadata(metadata);

        // Load track manifest and user role defensively
        let trackData = null;
        if (typeof contentLoaderService.fetchTrackManifest === 'function') {
          try {
            trackData = await contentLoaderService.fetchTrackManifest(currentTrackId);
          } catch (e) {
            console.error("Failed to load track manifest:", e);
          }
        }
        setTrackManifest(trackData);

        let role = 'student';
        if (typeof checkUserRole === 'function') {
          try {
            role = await checkUserRole();
          } catch (e) {
            console.error("Failed to check user role:", e);
          }
        }
        setUserRole(role || 'student');

        // Load all module content and tag each with its source file
        const stepPromises = manifest.modules.map(async (mod) => {
          const moduleData = await fetchModuleContent(currentTrackId, currentCourseId, mod.file);
          moduleData._sourceFile = `public/content/tracks/${currentTrackId}/${currentCourseId}/${mod.file}`;
          return moduleData;
        });

        const steps = await Promise.all(stepPromises);
        setCourseSteps(steps);

        // Load progress from Drive / Cache
        const token = getAccessToken();
        if (token) {
          const { progress, fileId } = await loadProgress();
          setDriveFileId(fileId);

          if (progress && progress._custom_themes) {
            localStorage.setItem('tridorian_custom_themes_list', JSON.stringify(progress._custom_themes));
          }
          if (progress && progress._custom_theme) {
            saveCustomTheme(progress._custom_theme);
          }

          const currentProgress = progress[`${currentTrackId}_${currentCourseId}`];
          if (currentProgress && currentProgress.completedIndices) {
            setCompletedSteps(currentProgress.completedIndices.map(Number));
          } else {
            setCompletedSteps([]);
          }

          // Resume session check
          let newest = null;
          for (const [key, val] of Object.entries(progress)) {
            if (val && val.lastUpdated) {
              if (!newest || new Date(val.lastUpdated) > new Date(newest.lastUpdated)) {
                const [tId, cId] = key.split('_');
                newest = {
                  trackId: tId,
                  courseId: cId,
                  moduleId: val.activeModuleId,
                  lastUpdated: val.lastUpdated
                };
              }
            }
          }

          if (newest && !isBannerDismissed) {
            const isSameModule = newest.trackId === currentTrackId && 
                                 newest.courseId === currentCourseId &&
                                 newest.moduleId === moduleId;
            if (!isSameModule) {
              setResumeSession(newest);
              setIsResumeBannerVisible(true);
            }
          }
        } else {
          setCompletedSteps([]);
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load course content:", err);
        setError(err.message);
        setIsLoading(false);
      }
    }

    loadCourse();
  }, [trackId, courseId, isBannerDismissed]);

  let activeStepIndex = 0;
  if (moduleId) {
    const index = courseSteps.findIndex(s => String(s.id) === String(moduleId));
    if (index !== -1) {
      activeStepIndex = index;
    }
  }

  // Scroll indicator hook
  useEffect(() => {
    const handleScroll = () => {
      const doc = document.documentElement;
      const totalHeight = doc.scrollHeight;
      const scrolled = window.innerHeight + window.scrollY;
      
      // Show indicator if there is scrollable content and we haven't scrolled to bottom
      if (totalHeight - scrolled > 120 && doc.scrollHeight > window.innerHeight + 100) {
        setShowScrollIndicator(true);
      } else {
        setShowScrollIndicator(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    
    // Check initial state after content renders
    const timer = setTimeout(handleScroll, 600);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      clearTimeout(timer);
    };
  }, [moduleId, activeStepIndex, courseSteps]);

  // Update progress in Drive whenever module or completed steps change
  useEffect(() => {
    if (driveFileId && moduleId && activeStepIndex !== -1) {
      const syncProgress = async () => {
        setSyncStatus('syncing');
        try {
          await saveCourseProgress(trackId, courseId, moduleId, completedSteps);
          setSyncStatus('synced');
        } catch (err) {
          console.error("Failed to save progress:", err);
          setSyncStatus('error');
        }
      };
      syncProgress();
    }
  }, [driveFileId, trackId, courseId, moduleId, completedSteps, activeStepIndex]);

  const handleRetrySync = async () => {
    if (!driveFileId || !moduleId) return;
    setSyncStatus('syncing');
    try {
      await saveCourseProgress(trackId, courseId, moduleId, completedSteps);
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('error');
    }
  };

  const activeStep = courseSteps[activeStepIndex];
  const totalSteps = courseSteps.length;
  const progressPercentage = totalSteps > 0 ? (completedSteps.length / totalSteps) * 100 : 0;

  // Re-evaluate quiz unlocking whenever module, step index, activeStep or completedSteps changes
  useEffect(() => {
    if (!activeStep) return;
    
    // Check if active step has an interactive quiz
    const questions = extractQuizQuestions(activeStep.blocks);
    const hasQuiz = questions && questions.length > 0;
    
    if (hasQuiz) {
      // If the step is already marked as completed, it's unlocked
      if (completedSteps.includes(activeStepIndex)) {
        setActiveStepQuizPassed(true);
      } else {
        setActiveStepQuizPassed(false);
      }
    } else {
      // If no quiz, progress is always unlocked
      setActiveStepQuizPassed(true);
    }
  }, [moduleId, activeStepIndex, activeStep, completedSteps]);

  // Scroll to top when step changes
  useEffect(() => {
    if (activeStepIndex !== 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeStepIndex]);

  const goToNext = () => {
    if (activeStepIndex < totalSteps - 1) {
      const nextIndex = activeStepIndex + 1;
      navigate(`/${currentTrackId}/${currentCourseId}/${courseSteps[nextIndex].id}`);
      if (!completedSteps.includes(activeStepIndex)) {
        setCompletedSteps(prev => [...prev, activeStepIndex]);
      }
    }
  };

  const goToPrev = () => {
    if (activeStepIndex > 0) {
      navigate(`/${currentTrackId}/${currentCourseId}/${courseSteps[activeStepIndex - 1].id}`);
    }
  };

  const completeCourse = () => {
    // Mark all steps as completed
    const allIndices = courseSteps.map((_, i) => i);
    setCompletedSteps(allIndices);
    setShowCelebration(true);
  };

  const handleResetProgress = async () => {
    const storageKey = 'agy_local_progress';
    try {
      const localProgress = JSON.parse(localStorage.getItem(storageKey) || '{}');
      const courseKey = `${currentTrackId}_${currentCourseId}`;
      delete localProgress[courseKey];
      localStorage.setItem(storageKey, JSON.stringify(localProgress));
    } catch (e) {
      console.error(e);
    }
    try {
      await saveCourseProgress(trackId, courseId, moduleId || '', []);
    } catch (err) {
      console.error(err);
    }
    setCompletedSteps([]);
    setShowResetModal(false);
  };

  const handleToggleComplete = async (index, e) => {
    e.stopPropagation();

    // Check if the step being completed has an unpassed quiz
    const targetStep = courseSteps[index];
    const questions = extractQuizQuestions(targetStep?.blocks);
    const hasQuiz = questions && questions.length > 0;

    if (!completedSteps.includes(index) && index === activeStepIndex && hasQuiz && !activeStepQuizPassed) {
      alert("Comprehension check required. Please pass the module quiz first.");
      return;
    }

    let updated;
    if (completedSteps.includes(index)) {
      updated = completedSteps.filter(i => i !== index);
    } else {
      updated = [...completedSteps, index].sort((a, b) => a - b);
    }
    setCompletedSteps(updated);
    try {
      await saveCourseProgress(trackId, courseId, moduleId || '', updated);
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="text-accent-text font-mono animate-pulse text-xl tracking-widest">
          LOADING TRIDORIAN MISSION...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-panel border border-red-900/50 rounded-lg p-8 text-center shadow-[0_0_30px_rgba(220,38,38,0.1)]">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-500 mb-2 uppercase tracking-tighter">Mission Interrupted</h2>
          <p className="text-gray-400 font-mono text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded font-mono text-xs transition-all"
          >
            RETURN TO DASHBOARD
          </button>
        </div>
      </div>
    );
  }

  if (!activeStep && moduleId) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="text-red-500 font-mono text-xl tracking-widest">
          ERROR: MISSION CONTENT NOT FOUND.
        </div>
      </div>
    );
  }

  // Get active courses in this track
  const activeCourses = trackManifest?.courses?.filter(
    course => userRole === 'admin' || course.status !== 'Draft'
  ) || [];

  const currentCourseIndex = activeCourses.findIndex(c => c.id === currentCourseId);
  const nextCourse = currentCourseIndex !== -1 && currentCourseIndex < activeCourses.length - 1
    ? activeCourses[currentCourseIndex + 1]
    : null;

  const trackCompleted = currentCourseIndex !== -1 && currentCourseIndex === activeCourses.length - 1;

  return (
    <div className="min-h-screen bg-base text-main font-sans flex flex-col md:flex-row selection:bg-accent selection:text-accent-fg relative overflow-hidden">
      <div className="theme-pattern-grid" />

      {/* Mobile Header */}
      <div className="md:hidden bg-panel border-b border-border-main p-4 flex justify-between items-center sticky top-0 z-50">
        <button 
          onClick={() => navigate('/')} 
          className="font-bold text-accent-text tracking-widest hover:opacity-85 transition-opacity"
        >
          TRIDORIAN
        </button>
        <div className="flex items-center gap-4">
          <GlobalControls theme={theme} setTheme={setTheme} />
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-main">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <div className={`
        ${isMobileMenuOpen ? 'block' : 'hidden'}
        md:block fixed md:sticky top-[61px] md:top-0 h-[calc(100vh-61px)] md:h-screen
        w-full md:w-80 bg-panel border-r border-border-main flex flex-col z-40
        transition-all duration-300 ease-in-out overflow-y-auto custom-scrollbar
      `}>
        <div className="p-6 hidden md:block border-b border-border-main">
          <div className="flex justify-between items-start mb-2">
            <button 
              onClick={() => navigate('/')} 
              className="font-extrabold text-xl text-accent-text tracking-[0.2em] hover:opacity-85 transition-opacity"
            >
              TRIDORIAN
            </button>
            <SyncStatus status={syncStatus} onRetry={handleRetrySync} />
          </div>
          <div className="flex justify-between items-center gap-2 mt-3">
            <div className="text-xs text-text-muted font-mono uppercase truncate max-w-[160px]" title={courseMetadata?.title}>
              {courseMetadata?.title || 'LABS // UNKNOWN'}
            </div>
            <GlobalControls theme={theme} setTheme={setTheme} />
          </div>
        </div>

        <div className="p-4 flex-1">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Course Modules</h2>
          <nav className="space-y-2">
            {courseSteps.map((step, index) => {
              const isCompleted = completedSteps.includes(index);
              const isActive = index === activeStepIndex;
              const isLocked = index > 0 && !completedSteps.includes(index - 1);

              return (
                <div
                  key={`${step.id || ""}-${index}`}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex justify-between items-center group relative ${
                    isActive
                      ? 'bg-muted text-accent-text border border-border-main shadow-accent'
                      : isLocked
                        ? 'text-gray-600 opacity-50'
                        : 'text-gray-400 hover:bg-muted/50 hover:text-main'
                  }`}
                >
                  <button
                    disabled={isLocked}
                    onClick={() => {
                      navigate(`/${currentTrackId}/${currentCourseId}/${step.id}`);
                      setIsMobileMenuOpen(false);
                    }}
                    className="absolute inset-0 w-full h-full z-0 rounded-lg text-transparent select-none"
                  >
                    {step.title}
                  </button>
                  <div className="flex items-center gap-3 min-w-0 relative z-10 pointer-events-none">
                    <button
                      onClick={(e) => handleToggleComplete(index, e)}
                      data-testid={`toggle-complete-${index}`}
                      className="flex-shrink-0 focus:outline-none pointer-events-auto"
                    >
                      {isLocked ? (
                        <Lock size={14} className="text-gray-600" />
                      ) : isCompleted ? (
                        <CheckCircle2 size={14} className="text-accent-text" data-testid={`check-icon-${index}`} />
                      ) : (
                        <div className={`w-3.5 h-3.5 rounded-full border ${isActive ? 'border-accent animate-pulse' : 'border-gray-500'}`}></div>
                      )}
                    </button>
                    <span className="truncate">{step.title}</span>
                  </div>
                  <span className="text-[10px] opacity-40 whitespace-nowrap font-mono relative z-10 pointer-events-none">{step.duration}</span>

                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent rounded-r-full shadow-accent z-20"></div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Global Progress */}
        <div className="p-6 border-t border-border-main bg-base">
          <div className="flex justify-between text-xs text-text-muted mb-2">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-accent progress-bar-fill transition-all duration-500 ease-out shadow-accent"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <button
            onClick={() => setShowResetModal(true)}
            className="w-full py-2 text-[10px] font-mono text-gray-500 hover:text-red-400 border border-border-main hover:border-red-900/30 rounded transition-all uppercase tracking-tighter"
          >
            Reset Progress
          </button>
          <button
            onClick={() => navigate('/help')}
            className="w-full mt-2 py-2 text-[10px] font-mono text-gray-500 hover:text-accent-text border border-border-main hover:border-accent-border rounded transition-all uppercase tracking-tighter flex items-center justify-center gap-1.5"
          >
            <HelpCircle size={10} />
            Help & Troubleshooting
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-panel border border-border-main rounded-xl p-8 max-w-sm w-full shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <h3 className="text-xl font-bold text-main mb-4">Reset Progress?</h3>
            <p className="text-text-muted text-sm mb-8 leading-relaxed">
              Are you sure you want to reset your progress for this course? This cannot be undone.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleResetProgress}
                className="w-full py-3 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded-lg font-bold transition-all"
              >
                Confirm Reset
              </button>
              <button
                onClick={() => setShowResetModal(false)}
                className="w-full py-3 bg-muted hover:bg-elevated text-gray-400 rounded-lg font-medium transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden pb-24 md:pb-0">

        {/* Resume Session Banner */}
        {isResumeBannerVisible && resumeSession && !isBannerDismissed && (
          <div className="bg-muted border-b border-accent-border p-4 animate-in slide-in-from-top duration-500 z-50">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center border border-accent-border">
                  <History size={20} className="text-accent-text" />
                </div>
                <div>
                  <div className="text-sm font-bold text-main">Resume Session?</div>
                  <div className="text-xs text-text-muted font-mono">
                    You were last working on <span className="text-accent-text">{resumeSession.courseId} / {resumeSession.moduleId}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setIsResumeBannerVisible(false);
                    setIsBannerDismissed(true);
                  }}
                  className="px-4 py-1.5 text-xs font-mono text-gray-400 hover:text-main transition-colors"
                >
                  DISMISS
                </button>
                <button 
                  onClick={() => {
                    navigate(`/${resumeSession.trackId}/${resumeSession.courseId}/${resumeSession.moduleId}`);
                    setIsResumeBannerVisible(false);
                  }}
                  className="px-4 py-1.5 bg-accent text-accent-fg text-xs font-bold rounded flex items-center gap-2 hover:brightness-110 transition-all"
                >
                  RESUME MISSION
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>

        <main className="flex-1 p-6 md:p-12 lg:p-16 max-w-4xl mx-auto w-full z-10">

          {/* Breadcrumbs */}
          <div className="mb-4 text-xs font-mono text-gray-500 tracking-wider">
             <button onClick={() => navigate(`/${currentTrackId}`)} className="hover:text-accent-text transition-colors">{trackManifest?.title || currentTrackId}</button>
             <span className="opacity-50 mx-1">/</span>
             <button onClick={() => navigate(`/${currentTrackId}/${currentCourseId}`)} className="hover:text-accent-text transition-colors">{courseMetadata?.title || currentCourseId}</button>
             {moduleId ? <><span className="opacity-50 mx-1">/</span> <span className="text-text-muted">{activeStep?.title}</span></> : null}
          </div>

          {!moduleId ? (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-main mb-6">Course Map</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courseSteps.map((step, index) => {
                   const isCompleted = completedSteps.includes(index);
                   const isLocked = index > 0 && !completedSteps.includes(index - 1);
                   return (
                     <div key={step.id} className={`p-4 rounded-xl border ${isLocked ? 'border-border-main bg-panel opacity-50' : 'border-border-main bg-muted'}`}>
                        <h3 className="font-bold text-accent-text mb-2">{step.title}</h3>
                        <p className="text-sm text-text-muted mb-4">{step.description || 'Module details'}</p>
                        <button
                          disabled={isLocked}
                          onClick={() => navigate(`/${currentTrackId}/${currentCourseId}/${step.id}`)}
                          className="text-xs px-4 py-2 bg-accent text-accent-fg font-bold rounded-lg hover:brightness-110"
                        >
                          {isCompleted ? 'Review Module' : 'Start Module'}
                        </button>
                     </div>
                   );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* Step Indicator */}
          <div className="mb-8 flex items-center justify-between">
            <div className="text-xs font-mono text-text-muted tracking-widest uppercase">
              Module {activeStepIndex + 1} <span className="opacity-30 mx-2">//</span> {activeStep.title.replace(/^\d+\.\s*/, '')}
            </div>
            <div className="text-[10px] font-mono text-gray-500">
              {activeStepIndex + 1} / {totalSteps}
            </div>
          </div>

          <div className="h-1 w-full bg-muted rounded-full overflow-hidden mb-12">
            <div
              className="h-full bg-gradient-to-r from-border-main to-accent transition-all duration-700 ease-in-out"
              style={{ width: `${((activeStepIndex + 1) / totalSteps) * 100}%` }}
            ></div>
          </div>

          {/* Inject Content */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ModuleRenderer module={activeStep} sourceFile={activeStep?._sourceFile} onQuizPassed={() => setActiveStepQuizPassed(true)} />
          </div>
            </>
          )}
        </main>

        {/* Bottom Navigation Bar */}
        {moduleId && (
        <footer className="fixed md:sticky bottom-0 w-full md:w-auto bg-panel border-t border-border-main p-4 px-6 md:px-12 flex justify-between items-center z-30">
          <button
            onClick={goToPrev}
            disabled={activeStepIndex === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeStepIndex === 0
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-main hover:bg-muted'
            }`}
          >
            <ChevronLeft size={20} />
            Back
          </button>

          {activeStepIndex === totalSteps - 1 ? (
            completedSteps.includes(activeStepIndex) ? (
              <div className="flex gap-3">
                <button
                  onClick={completeCourse}
                  className="flex items-center gap-2 px-4 py-2 border border-border-main text-text-muted hover:text-main rounded-lg font-medium transition-colors"
                >
                  <Trophy size={16} />
                  Review Badge
                </button>
                {nextCourse ? (
                  <button
                    onClick={() => navigate(`/${currentTrackId}/${nextCourse.id}`)}
                    className="flex items-center gap-2 px-6 py-2 bg-accent text-accent-fg rounded-lg font-bold hover:brightness-110 shadow-accent transition-all"
                  >
                    Next Course
                    <ChevronRight size={20} />
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 px-6 py-2 bg-accent text-accent-fg rounded-lg font-bold hover:brightness-110 shadow-accent transition-all"
                  >
                    Complete Track
                  </button>
                )}
              </div>
            ) : (
              <button
                disabled={!activeStepQuizPassed}
                onClick={completeCourse}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${
                  activeStepQuizPassed
                    ? 'bg-accent text-accent-fg hover:brightness-110 shadow-accent animate-pulse'
                    : 'bg-muted text-gray-500 border border-border-main cursor-not-allowed opacity-50'
                }`}
              >
                {activeStepQuizPassed ? <Trophy size={20} /> : <Lock size={20} />}
                Complete Course
              </button>
            )
          ) : (
            <button
              disabled={!activeStepQuizPassed}
              onClick={goToNext}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${
                activeStepQuizPassed
                  ? 'bg-accent text-accent-fg hover:brightness-110 shadow-accent'
                  : 'bg-muted text-gray-500 border border-border-main cursor-not-allowed opacity-50'
              }`}
            >
              {!activeStepQuizPassed && <Lock size={16} />}
              Next
              <ChevronRight size={20} />
            </button>
          )}
        </footer>
        )}
      </div>

      {showScrollIndicator && (
        <div className="fixed bottom-24 md:bottom-8 right-6 bg-accent backdrop-blur text-accent-fg px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold shadow-accent animate-bounce z-40">
          <span>Scroll down to proceed</span>
          <ArrowDown size={14} />
        </div>
      )}

      {showCelebration && (
        <BadgeCelebration
          badgeTitle={courseMetadata?.title || 'Course Completed'}
          trackName={trackManifest?.title || trackId}
          nextCourse={nextCourse}
          trackCompleted={trackCompleted}
          onNextCourse={() => {
            setShowCelebration(false);
            if (nextCourse) {
              navigate(`/${currentTrackId}/${nextCourse.id}`);
            }
          }}
          onReturnToDashboard={() => {
            setShowCelebration(false);
            navigate('/');
          }}
          onDismiss={() => {
            setShowCelebration(false);
            navigate(`/${currentTrackId}/${currentCourseId}`);
          }}
        />
      )}

    </div>
  );
}


export default function App() {
  const { theme, setTheme } = useTheme();

  // Unlock browser audio context on user interaction and start theme music
  useEffect(() => {
    let unlocked = false;

    const handleInteraction = () => {
      if (unlocked) return;
      unlocked = true;
      console.log(`[Theme Audio] Interaction detected. Launching theme music: ${theme}`);
      themeAudio.playThemeMusic(theme);

      // Clean up event listeners immediately
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [theme]);

  // Transition theme music dynamically when theme state changes (if already initialized/playing)
  useEffect(() => {
    const audioState = themeAudio.getAudioState();
    if (audioState.currentLoopId && audioState.currentLoopId !== theme) {
      console.log(`[Theme Audio] Theme transitioned from ${audioState.currentLoopId} to ${theme}. Updating synthesizer...`);
      themeAudio.playThemeMusic(theme);
    }
  }, [theme]);

  return (
    <Routes>
      <Route path="/" element={<Dashboard theme={theme} setTheme={setTheme} />} />
      <Route path="/admin" element={<AdminPanel theme={theme} setTheme={setTheme} />} />
      <Route path="/help" element={<HelpSection theme={theme} setTheme={setTheme} />} />
      <Route path="/:trackId" element={<TrackPage theme={theme} setTheme={setTheme} />} />
      <Route path="/:trackId/:courseId" element={<AppContent theme={theme} setTheme={setTheme} />} />
      <Route path="/:trackId/:courseId/:moduleId" element={<AppContent theme={theme} setTheme={setTheme} />} />
    </Routes>
  );
}
