import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { fetchCatalog, fetchTrackManifest } from '../services/contentLoader';
import * as googleAuth from '../services/googleAuth';
import { checkUserRole } from '../services/roleManager';
import GlobalControls from './GlobalControls';
import ProfileModal from './ProfileModal';
import { loadProgress } from '../services/googleDrive';
import { saveCustomTheme } from '../services/customTheme';

const Dashboard = ({ theme, setTheme }) => {
  const [catalog, setCatalog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trackProgress, setTrackProgress] = useState({});
  const [isConnected, setIsConnected] = useState(!!googleAuth.getAccessToken());
  const [role, setRole] = useState('student');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadCatalog() {
      try {
        const [data, userRole] = await Promise.all([
          fetchCatalog(),
          checkUserRole()
        ]);

        // Enrich catalog tracks with course lists from their manifests
        const tracksWithCourses = await Promise.all(
          (data.tracks || []).map(async (t) => {
            if (t.courses) {
              return t;
            }
            try {
              const trackManifest = await fetchTrackManifest(t.id);
              return { ...t, courses: trackManifest.courses || [] };
            } catch (err) {
              console.error(`Failed to load track manifest for ${t.id}:`, err);
              return { ...t, courses: [] };
            }
          })
        );

        const enrichedCatalog = { ...data, tracks: tracksWithCourses };
        setCatalog(enrichedCatalog);
        setRole(userRole);

        // Fetch progress from Drive/cache if connected to restore state & custom theme on Dashboard
        let progress = null;
        if (googleAuth.getAccessToken()) {
          try {
            const syncData = await loadProgress();
            progress = syncData ? syncData.progress : null;
            if (progress && progress._custom_themes) {
              localStorage.setItem('tridorian_custom_themes_list', JSON.stringify(progress._custom_themes));
            }
            if (progress && progress._custom_theme) {
              saveCustomTheme(progress._custom_theme);
            }
          } catch (e) {
            console.warn("Failed to load Drive progress on Dashboard:", e);
          }
        }

        const localProgress = progress || JSON.parse(localStorage.getItem('agy_local_progress') || '{}');
        const progressStats = {};

        for (const track of enrichedCatalog.tracks) {
          let totalModules = 0;
          let completedModules = 0;

          if (track.courses) {
            track.courses.forEach(course => {
              totalModules += course.modules || 0;
              const courseProg = localProgress[`${track.id}_${course.id}`];
              if (courseProg && courseProg.completedIndices) {
                completedModules += courseProg.completedIndices.length;
              }
            });
          }

          progressStats[track.id] = {
            percentage: totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0
          };
        }
        setTrackProgress(progressStats);
      } catch (err) {
        console.error('Failed to load catalog:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    loadCatalog();
  }, [isConnected]);

  const handleConnect = async () => {
    try {
      await googleAuth.signIn();
      setIsConnected(true);
    } catch (err) {
      console.error('Failed to connect to Google Drive:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="text-accent-text font-mono animate-pulse text-xl tracking-widest">
          INITIALIZING TRIDORIAN...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-panel border border-red-900/50 rounded-lg p-8 text-center">
          <Icons.AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-500 mb-2">CATALOG UNAVAILABLE</h2>
          <p className="text-gray-400 font-mono text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base text-main selection:bg-accent selection:text-accent-fg relative overflow-hidden">
      <div className="theme-pattern-grid" />
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-accent/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-8 md:py-12">
        {/* Top Controls Row */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-12 border-b border-border-subtle pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <Link 
              to="/help" 
              className="flex items-center gap-2 px-3 py-1.5 bg-muted text-accent-text border border-accent-border rounded-full text-[10px] font-mono hover:bg-accent/10 transition-all uppercase tracking-widest"
            >
              <Icons.HelpCircle size={12} />
              Help & Troubleshooting
            </Link>
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-muted text-accent-text border border-accent-border rounded-full text-[10px] font-mono hover:bg-accent/10 transition-all uppercase tracking-widest"
            >
              <Icons.User size={12} />
              My Profile
            </button>
            <GlobalControls theme={theme} setTheme={setTheme} />
          </div>
          {role === 'admin' && (
            <Link 
              to="/admin" 
              className="flex items-center gap-2 px-3 py-1.5 bg-muted text-accent-text border border-accent-border rounded-full text-[10px] font-mono hover:bg-accent/10 transition-all uppercase tracking-widest"
            >
              <Icons.Shield size={12} />
              Admin Control Panel
            </Link>
          )}
        </div>

        {/* Connection Status / Onboarding Banner */}
        <div className="mb-12">
          {!isConnected ? (
            <div className="bg-muted border border-accent-border rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-accent">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center border border-accent-border">
                  <Icons.CloudOff className="text-accent-text" size={24} />
                </div>
                <div>
                  <h3 className="text-main font-bold">Connect Google Drive to Sync Progress</h3>
                  <p className="text-text-muted text-sm">Save your mission status across devices and resume where you left off.</p>
                </div>
              </div>
              <button
                onClick={handleConnect}
                className="px-6 py-2 bg-accent text-accent-fg font-bold rounded-lg hover:brightness-110 transition-all shadow-accent whitespace-nowrap"
              >
                Connect Sync
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-2 text-[10px] font-mono text-accent-text uppercase tracking-widest opacity-70">
              <Icons.Cloud size={12} />
              <span>Drive Sync Connected</span>
            </div>
          )}
        </div>

        {/* Header */}
        <div className="text-center mb-16 relative">
          <div className="font-extrabold text-2xl text-accent-text tracking-[0.3em] mb-4">TRIDORIAN</div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-main mb-4">Course Catalog</h1>
          <p className="text-lg text-text-muted max-w-2xl mx-auto">
            Select a learning track to begin your mission. Each track contains multiple courses designed to build expertise progressively.
          </p>
        </div>

        {/* Track Cards */}
        <div className="grid grid-cols-1 gap-6">
          {catalog.tracks.map((track) => {
            const TrackIcon = Icons[track.icon] || Icons.BookOpen;
            return (
              <button
                key={track.id}
                onClick={() => navigate(`/${track.id}`)}
                className="group text-left w-full bg-panel border border-border-main rounded-2xl p-8 hover:border-accent transition-all duration-300 hover:shadow-accent relative overflow-hidden"
              >
                {/* Hover glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-accent/0 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                <div className="relative flex items-start gap-6">
                  <div className="w-16 h-16 bg-muted rounded-xl flex items-center justify-center border border-border-main group-hover:border-accent group-hover:shadow-accent transition-all duration-300 flex-shrink-0">
                    <TrackIcon className="text-accent-text" size={32} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-main group-hover:text-accent-text transition-colors">{track.title}</h2>
                        <Icons.ChevronRight className="text-gray-600 group-hover:text-accent-text group-hover:translate-x-1 transition-all" size={24} />
                      </div>
                      {trackProgress[track.id] && (
                        <div className="text-[10px] font-mono text-accent-text border border-accent-border px-2 py-0.5 rounded bg-accent/5">
                          {trackProgress[track.id].percentage}% COMPLETE
                        </div>
                      )}
                    </div>
                    <p className="text-text-muted text-sm leading-relaxed">{track.description}</p>
                  </div>
                </div>

                {/* Track ID badge */}
                <div className="absolute top-4 right-4 text-[10px] font-mono text-gray-600 tracking-wider uppercase">
                  {track.id}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-[10px] font-mono text-gray-600 tracking-widest uppercase">
          tridorian Learning Platform v1.0
        </div>
      </div>

      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        catalog={catalog} 
      />
    </div>
  );
};

export default Dashboard;
