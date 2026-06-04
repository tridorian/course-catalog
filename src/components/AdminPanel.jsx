import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, RefreshCw, ChevronLeft, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { checkUserRole } from '../services/roleManager';
import { fetchCatalog, fetchTrackManifest } from '../services/contentLoader';
import GlobalControls from './GlobalControls';

const AdminPanel = ({ theme, setTheme }) => {
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [catalog, setCatalog] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function init() {
      const userRole = await checkUserRole();
      setRole(userRole);
      
      if (userRole === 'admin') {
        try {
          const catalogData = await fetchCatalog();
          
          // Enrich catalog with all courses from all tracks
          const tracksWithCourses = await Promise.all(
            catalogData.tracks.map(async (t) => {
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
          
          setCatalog({ tracks: tracksWithCourses });
        } catch (err) {
          console.error('Failed to load admin catalog:', err);
        }
      }
      setIsLoading(false);
    }
    init();
  }, []);

  const triggerSync = async () => {
    setSyncing(true);
    try {
      console.log('Dispatching GitHub Repository Dispatch event...');
      const response = await fetch('https://api.github.com/repos/tridorian/course-catalog/dispatches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_type: 'sync-catalog'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to dispatch sync');
      }
      
      setNotification({
        type: 'success',
        message: 'Sync action dispatched successfully'
      });
      
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'Failed to dispatch sync action'
      });
    } finally {
      setSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="text-accent-text font-mono animate-pulse text-xl tracking-widest">
          AUTHENTICATING ADMINISTRATOR...
        </div>
      </div>
    );
  }

  if (role !== 'admin') {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-panel border border-red-900/50 rounded-lg p-8 text-center shadow-[0_0_30px_rgba(220,38,38,0.1)]">
          <Shield size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-500 mb-2 uppercase tracking-tighter">Access Denied</h2>
          <p className="text-gray-400 font-mono text-sm mb-6">Administrator Credentials Required</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded font-mono text-xs transition-all w-full"
          >
            RETURN TO DASHBOARD
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base text-main selection:bg-accent selection:text-accent-fg relative overflow-hidden">
      <div className="theme-pattern-grid" />
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-accent/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-2 text-accent-text mb-2">
              <Shield size={18} />
              <span className="font-mono text-xs tracking-[0.3em] uppercase">Security Level: Administrator</span>
            </div>
            <h1 className="text-4xl font-extrabold text-main">tridorian Admin Control Center</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <GlobalControls theme={theme} setTheme={setTheme} />
            <Link 
              to="/" 
              className="flex items-center gap-2 px-4 py-2 bg-muted text-text-muted border border-border-main rounded-lg hover:bg-elevated transition-all text-sm font-medium"
            >
              <ChevronLeft size={16} />
              Dashboard
            </Link>
            <button
              onClick={triggerSync}
              disabled={syncing}
              className="flex items-center gap-2 px-6 py-2 bg-accent text-accent-fg font-bold rounded-lg hover:brightness-110 transition-all shadow-accent"
            >
              <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Dispatching...' : 'Trigger Catalog Sync'}
            </button>
          </div>
        </div>

        {/* Notifications */}
        {notification && (
          <div className={`mb-8 p-4 rounded-lg border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
            notification.type === 'success' ? 'bg-muted border-accent-border text-accent-text' : 'bg-red-900/10 border-red-900/50 text-red-400'
          }`}>
            {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span className="font-mono text-sm">{notification.message}</span>
          </div>
        )}

        {/* Catalog Content */}
        <div className="space-y-12">
          {catalog?.tracks.map((track) => (
            <div key={track.id} className="bg-panel border border-border-main rounded-2xl overflow-hidden shadow-xl">
              <div className="p-6 bg-muted/50 border-b border-border-main flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-main flex items-center gap-3">
                    {track.title}
                    <span className="px-2 py-0.5 bg-base text-text-muted text-[10px] font-mono border border-border-main rounded">
                      {track.id}
                    </span>
                  </h2>
                  <p className="text-text-muted text-sm mt-1">{track.description}</p>
                </div>
                <Link 
                  to={`/${track.id}`}
                  className="text-accent-text hover:text-text-muted transition-colors p-2"
                  title="View Track"
                >
                  <ExternalLink size={20} />
                </Link>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border-main text-[10px] font-mono text-gray-500 uppercase tracking-widest bg-base/50">
                      <th className="px-6 py-4 font-medium">Course ID</th>
                      <th className="px-6 py-4 font-medium">Course Title</th>
                      <th className="px-6 py-4 font-medium">Modules</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-main">
                    {track.courses.map((course) => (
                      <tr key={course.id} className="hover:bg-muted/20 transition-colors group">
                        <td className="px-6 py-4 font-mono text-xs text-text-muted">{course.id}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-main group-hover:text-accent-text transition-colors">{course.title}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-muted">{course.modules}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter ${
                            course.status?.toLowerCase() === 'draft' 
                              ? 'bg-yellow-900/20 text-yellow-500 border border-yellow-900/50' 
                              : 'bg-accent/10 text-accent-text border border-accent-border'
                          }`}>
                            {(course.status || 'PUBLISHED').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link 
                            to={`/${track.id}/${course.id}`}
                            className="text-xs text-gray-500 hover:text-accent-text transition-colors font-mono"
                          >
                            PREVIEW_MODULES
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <div className="text-[10px] font-mono text-gray-600 tracking-widest uppercase mb-4">
            Security Protocol T-104 // tridorian Network Administration
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
