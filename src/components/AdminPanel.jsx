import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Shield, 
  RefreshCw, 
  ChevronLeft, 
  ChevronDown, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle, 
  ExternalLink, 
  LogIn, 
  Folder, 
  FolderOpen, 
  FileText, 
  Save, 
  Search, 
  Maximize2, 
  Minimize2 
} from 'lucide-react';
import { checkUserRole } from '../services/roleManager';
import { fetchCatalog, fetchTrackManifest, fetchSyncConfig } from '../services/contentLoader';
import { useAuth } from '../context/AuthContext';
import { APP_CONFIG } from '../config';
import GlobalControls from './GlobalControls';

// Track folder mappings in Google Drive
const DEFAULT_TRACK_FOLDERS = {
  'agentic-engineering': '1Qz3O9gMN96IdSKE2lKmYjj75CmCQ_Mq2',
  'adk-development': '1YA7-uzdcoPT6w0ImvFZeHXrBOOJUNe0q'
};

const AdminPanel = ({ theme, setTheme }) => {
  const { user, role: authRole, isAuthenticated, signIn } = useAuth();
  const [role, setRole] = useState(authRole || null);
  const [isLoading, setIsLoading] = useState(true);
  const [catalog, setCatalog] = useState(null);
  const [syncConfig, setSyncConfig] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Parent Drive folder state
  const [parentFolderId, setParentFolderId] = useState(() => {
    return (typeof localStorage !== 'undefined' && localStorage.getItem('tridorian_parent_drive_folder_id')) || APP_CONFIG.parentDriveFolderId || '1UTsC7YPjz72BiwqJDyJx6VydyHGgW160';
  });
  const [savedFolderAlert, setSavedFolderAlert] = useState(false);

  // Track collapse state (keyed by track.id -> boolean; false = expanded, true = collapsed)
  const [collapsedTracks, setCollapsedTracks] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    async function init() {
      let userRole = authRole;
      if (!userRole || userRole === 'student') {
        try {
          const r = await checkUserRole();
          if (r === 'admin') userRole = 'admin';
        } catch (e) {}
      }
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
                return { 
                  ...t, 
                  driveFolderId: t.driveFolderId || DEFAULT_TRACK_FOLDERS[t.id] || '',
                  courses: trackManifest.courses || [] 
                };
              } catch (err) {
                console.error(`Failed to load track manifest for ${t.id}:`, err);
                return { 
                  ...t, 
                  driveFolderId: t.driveFolderId || DEFAULT_TRACK_FOLDERS[t.id] || '',
                  courses: [] 
                };
              }
            })
          );
          
          setCatalog({ tracks: tracksWithCourses });
        } catch (err) {
          console.error('Failed to load admin catalog:', err);
        }

        // Load sync-config mapping for Google Doc links
        try {
          const syncData = await fetchSyncConfig();
          setSyncConfig(Array.isArray(syncData) ? syncData : []);
        } catch (e) {
          setSyncConfig([]);
        }
      }
      setIsLoading(false);
    }
    init();
  }, [authRole]);

  const toggleTrackCollapse = (trackId) => {
    setCollapsedTracks(prev => ({
      ...prev,
      [trackId]: !prev[trackId]
    }));
  };

  const collapseAll = () => {
    if (!catalog?.tracks) return;
    const allCollapsed = {};
    catalog.tracks.forEach(t => { allCollapsed[t.id] = true; });
    setCollapsedTracks(allCollapsed);
  };

  const expandAll = () => {
    setCollapsedTracks({});
  };

  const handleSaveParentFolder = (e) => {
    e.preventDefault();
    const trimmed = parentFolderId.trim();
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('tridorian_parent_drive_folder_id', trimmed);
    }
    setSavedFolderAlert(true);
    setTimeout(() => setSavedFolderAlert(false), 3000);
  };

  const triggerSync = async () => {
    setSyncing(true);
    setSyncResult({ status: 'syncing' });
    const proxyBase = (APP_CONFIG.proxyUrl || '/api').replace(/\/+$/, '');
    const syncUrl = `${proxyBase}/sync-catalog`;
    const defaultWorkflowUrl = 'https://github.com/tridorian/course-catalog/actions/workflows/content-sync.yml';

    try {
      console.log(`[Admin] Triggering catalog sync via proxy: ${syncUrl}`);
      const response = await fetch(syncUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: user?.email || 'admin@tridorian.com',
          parentFolderId: parentFolderId.trim(),
          initiatedAt: new Date().toISOString()
        })
      });

      let data = {};
      try {
        data = await response.json();
      } catch (e) {
        data = {};
      }

      if (!response.ok || data.success === false) {
        const errorMsg = data.error || (response.statusText ? `Request failed with status ${response.status}` : 'Failed to dispatch sync action');
        const workflowUrl = data.workflowUrl || defaultWorkflowUrl;
        setSyncResult({
          status: 'error',
          error: errorMsg,
          workflowUrl,
          isMissingToken: errorMsg.includes('GITHUB_DISPATCH_TOKEN') || errorMsg.includes('token')
        });
      } else {
        const successMsg = data.message || 'Catalog sync dispatched! GitHub Action is pulling Google Docs and deploying to Cloud Run.';
        const workflowUrl = data.workflowUrl || defaultWorkflowUrl;
        setSyncResult({
          status: 'success',
          message: successMsg,
          workflowUrl
        });
      }
    } catch (err) {
      console.error('[Admin] Sync dispatch failed:', err);
      setSyncResult({
        status: 'error',
        error: err.message || 'Failed to dispatch sync action',
        workflowUrl: defaultWorkflowUrl,
        isMissingToken: (err.message || '').includes('token')
      });
    } finally {
      setSyncing(false);
    }
  };

  const getDocIdForCourse = (trackId, courseId) => {
    if (!Array.isArray(syncConfig)) return null;
    const entry = syncConfig.find(item => item && item.courseId === courseId && (item.trackId === trackId || !item.trackId));
    return entry?.docId;
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
          <p className="text-gray-400 font-mono text-sm mb-2">Administrator Credentials Required</p>
          <p className="text-text-muted text-xs font-mono mb-6">
            Authorized administrator account (<span className="text-accent-text font-bold">taylor.granstaff@tridorian.com</span>) required to access this console.
          </p>
          <div className="space-y-3">
            <button
              onClick={async () => {
                try {
                  const signedInUser = await signIn();
                  if (signedInUser?.role === 'admin') {
                    setRole('admin');
                  }
                } catch (e) {
                  console.error('Admin sign in failed:', e);
                }
              }}
              className="px-6 py-2.5 bg-accent text-accent-fg font-bold rounded-lg hover:brightness-110 transition-all font-mono text-xs w-full shadow-accent flex items-center justify-center gap-2"
              aria-label="Sign In as Administrator"
            >
              <LogIn size={14} />
              Sign In as Administrator
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded font-mono text-xs transition-all w-full"
            >
              RETURN TO DASHBOARD
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter tracks and courses by search
  const filteredTracks = catalog?.tracks.map(track => {
    if (!searchQuery.trim()) return track;
    const q = searchQuery.toLowerCase();
    const trackMatches = track.title?.toLowerCase().includes(q) || track.id?.toLowerCase().includes(q);
    const matchingCourses = track.courses.filter(c => 
      c.title?.toLowerCase().includes(q) || 
      c.id?.toLowerCase().includes(q) ||
      c.level?.toLowerCase().includes(q) ||
      (c.tags && c.tags.some(tag => tag.toLowerCase().includes(q)))
    );
    if (trackMatches) return track;
    return { ...track, courses: matchingCourses };
  }).filter(track => track.courses.length > 0 || track.title?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-base text-main selection:bg-accent selection:text-accent-fg relative overflow-hidden">
      <div className="theme-pattern-grid" />
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-accent/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
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

        {/* Google Drive Parent Folder Configuration Bar */}
        <div className="mb-8 p-5 bg-panel border border-border-main rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent-border flex items-center justify-center text-accent-text shrink-0">
              <Folder size={20} />
            </div>
            <div>
              <div className="text-xs font-mono text-text-muted uppercase tracking-wider">Root Course Catalog Drive Folder</div>
              <div className="text-sm font-bold text-main flex items-center gap-2 mt-0.5">
                Google Drive Storage Parent
                <a 
                  href={`https://drive.google.com/drive/folders/${parentFolderId.trim()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-text hover:underline text-xs font-mono flex items-center gap-1"
                  title="Open Parent Drive Folder"
                >
                  <ExternalLink size={12} />
                  Open in Drive
                </a>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveParentFolder} className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <input
                type="text"
                value={parentFolderId}
                onChange={(e) => setParentFolderId(e.target.value)}
                placeholder="Google Drive Parent Folder ID"
                className="w-full bg-base border border-border-main rounded-lg px-3 py-2 text-xs font-mono text-main focus:outline-none focus:border-accent"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-muted hover:bg-elevated text-main border border-border-main rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all shrink-0"
              title="Save Folder ID locally"
            >
              <Save size={14} className="text-accent-text" />
              Save
            </button>
            {savedFolderAlert && (
              <span className="text-[10px] font-mono text-accent-text animate-pulse">Saved!</span>
            )}
          </form>
        </div>

        {/* Rich Sync Card */}
        {syncResult && (
          <div className="mb-8 rounded-2xl border bg-panel overflow-hidden shadow-2xl transition-all animate-in fade-in slide-in-from-top-4 duration-300">
            {syncResult.status === 'syncing' && (
              <div className="p-6 border border-accent-border/50 bg-accent/5 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent-border flex items-center justify-center text-accent-text">
                    <RefreshCw size={22} className="animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-main flex items-center gap-2">
                      Catalog Sync in Progress...
                    </h3>
                    <p className="text-xs font-mono text-text-muted mt-0.5">
                      Dispatching trigger to GitHub Actions pipeline (fetching Docs & compiling JSONs)...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {syncResult.status === 'success' && (
              <div className="p-6 border border-accent-border bg-accent/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent-border flex items-center justify-center text-accent-text shrink-0 mt-0.5">
                    <CheckCircle size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-accent-text flex items-center gap-2">
                      Sync Action Dispatched Successfully
                    </h3>
                    <p className="text-xs font-mono text-text-muted mt-1">
                      {syncResult.message}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <a
                    href={syncResult.workflowUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-accent-fg font-bold rounded-lg hover:brightness-110 transition-all text-xs font-mono shadow-accent"
                  >
                    <ExternalLink size={14} />
                    View GitHub Actions Workflow
                  </a>
                </div>
              </div>
            )}

            {syncResult.status === 'error' && (
              <div className="p-6 border border-red-900/50 bg-red-950/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-900/30 border border-red-900/50 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
                    <AlertCircle size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-red-400 flex items-center gap-2">
                      Sync Dispatch Encountered an Issue
                    </h3>
                    <p className="text-xs font-mono text-red-300/80 mt-1">
                      {syncResult.error}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <a
                    href={syncResult.workflowUrl || 'https://github.com/tridorian/course-catalog/actions/workflows/content-sync.yml'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-900/40 hover:bg-red-900/60 text-red-200 border border-red-700/50 rounded-lg text-xs font-mono transition-all"
                  >
                    <ExternalLink size={14} />
                    Trigger via GitHub Actions
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search and Global Expand/Collapse Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tracks, courses, or tags..."
              className="w-full bg-panel border border-border-main rounded-lg pl-9 pr-4 py-2 text-xs font-mono text-main focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-1.5 bg-panel border border-border-main hover:bg-muted rounded-lg text-xs font-mono text-text-muted hover:text-main flex items-center gap-1.5 transition-all"
            >
              <Maximize2 size={12} />
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 bg-panel border border-border-main hover:bg-muted rounded-lg text-xs font-mono text-text-muted hover:text-main flex items-center gap-1.5 transition-all"
            >
              <Minimize2 size={12} />
              Collapse All
            </button>
          </div>
        </div>

        {/* Catalog Content */}
        <div className="space-y-8">
          {filteredTracks?.map((track) => {
            const isCollapsed = Boolean(collapsedTracks[track.id]);
            const driveFolderId = track.driveFolderId || DEFAULT_TRACK_FOLDERS[track.id];

            return (
              <div key={track.id} className="bg-panel border border-border-main rounded-2xl overflow-hidden shadow-xl transition-all">
                {/* Track Header (Clickable to collapse) */}
                <div 
                  onClick={() => toggleTrackCollapse(track.id)}
                  className="p-5 bg-muted/40 hover:bg-muted/70 cursor-pointer border-b border-border-main flex justify-between items-center transition-colors select-none"
                >
                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      className="text-text-muted hover:text-accent-text transition-colors p-1"
                      aria-label={isCollapsed ? 'Expand Track' : 'Collapse Track'}
                    >
                      {isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
                    </button>
                    <div>
                      <h2 className="text-lg font-bold text-main flex items-center gap-2.5 flex-wrap">
                        {track.title}
                        <span className="px-2 py-0.5 bg-base text-text-muted text-[10px] font-mono border border-border-main rounded">
                          {track.id}
                        </span>
                        <span className="text-xs font-mono font-normal text-text-muted">
                          ({track.courses.length} courses)
                        </span>
                      </h2>
                      <p className="text-text-muted text-xs mt-0.5 line-clamp-1">{track.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    {driveFolderId && (
                      <a
                        href={`https://drive.google.com/drive/folders/${driveFolderId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-base hover:bg-elevated text-accent-text border border-accent-border/40 rounded-lg text-xs font-mono transition-all"
                        title="Open Track Google Drive Folder"
                      >
                        <FolderOpen size={14} />
                        Drive Folder
                        <ExternalLink size={10} />
                      </a>
                    )}
                    <Link 
                      to={`/${track.id}`}
                      className="text-accent-text hover:text-text-muted transition-colors p-2"
                      title="View Track in Portal"
                    >
                      <ExternalLink size={18} />
                    </Link>
                  </div>
                </div>
                
                {/* Collapsible Course Table */}
                {!isCollapsed && (
                  <div className="overflow-x-auto animate-in fade-in duration-200">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border-main text-[10px] font-mono text-gray-500 uppercase tracking-widest bg-base/50">
                          <th className="px-6 py-3 font-medium">Course ID</th>
                          <th className="px-6 py-3 font-medium">Course Title</th>
                          <th className="px-6 py-3 font-medium">Modules</th>
                          <th className="px-6 py-3 font-medium">Status</th>
                          <th className="px-6 py-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y border-border-main">
                        {track.courses.map((course) => {
                          const docId = getDocIdForCourse(track.id, course.id);

                          return (
                            <tr key={course.id} className="hover:bg-muted/20 transition-colors group">
                              <td className="px-6 py-3 font-mono text-xs text-text-muted">{course.id}</td>
                              <td className="px-6 py-3">
                                <div className="font-medium text-main group-hover:text-accent-text transition-colors flex items-center gap-2">
                                  {course.title}
                                  {docId && (
                                    <a
                                      href={`https://docs.google.com/document/d/${docId}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-text-muted hover:text-accent-text opacity-50 group-hover:opacity-100 transition-opacity"
                                      title="Open Source Google Doc"
                                    >
                                      <FileText size={13} />
                                    </a>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-3 text-sm text-text-muted">{course.modules}</td>
                              <td className="px-6 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter ${
                                  course.status?.toLowerCase() === 'draft' 
                                    ? 'bg-yellow-900/20 text-yellow-500 border border-yellow-900/50' 
                                    : 'bg-accent/10 text-accent-text border border-accent-border'
                                }`}>
                                  {(course.status || 'PUBLISHED').toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-3 text-right">
                                <div className="flex items-center justify-end gap-3">
                                  {docId && (
                                    <a
                                      href={`https://docs.google.com/document/d/${docId}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-accent-text hover:underline font-mono flex items-center gap-1"
                                      title="Edit Google Doc"
                                    >
                                      <FileText size={12} />
                                      DOC
                                    </a>
                                  )}
                                  <Link 
                                    to={`/${track.id}/${course.id}`}
                                    className="text-xs text-gray-500 hover:text-accent-text transition-colors font-mono"
                                  >
                                    PREVIEW
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
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
