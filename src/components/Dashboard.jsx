import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { fetchCatalog, fetchTrackManifest } from '../services/contentLoader';
import * as googleAuth from '../services/googleAuth';

const Dashboard = () => {
  const [catalog, setCatalog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trackProgress, setTrackProgress] = useState({});
  const [isConnected, setIsConnected] = useState(!!googleAuth.getAccessToken());
  const navigate = useNavigate();

  useEffect(() => {
    async function loadCatalog() {
      try {
        const data = await fetchCatalog();
        setCatalog(data);

        const localProgress = JSON.parse(localStorage.getItem('agy_local_progress') || '{}');
        const progressStats = {};

        for (const track of data.tracks) {
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
  }, []);

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
      <div className="min-h-screen bg-[#050805] flex items-center justify-center">
        <div className="text-[#4ade80] font-mono animate-pulse text-xl tracking-widest">
          INITIALIZING TRIDORIAN...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050805] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#0a120c] border border-red-900/50 rounded-lg p-8 text-center">
          <Icons.AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-500 mb-2">CATALOG UNAVAILABLE</h2>
          <p className="text-gray-400 font-mono text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050805] text-[#f0fdf4] selection:bg-[#4ade80] selection:text-black">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#4ade80]/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        {/* Connection Status / Onboarding Banner */}
        <div className="mb-12">
          {!isConnected ? (
            <div className="bg-[#132617] border border-[#4ade80]/30 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_20px_rgba(74,222,128,0.05)]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#4ade80]/10 rounded-full flex items-center justify-center border border-[#4ade80]/20">
                  <Icons.CloudOff className="text-[#4ade80]" size={24} />
                </div>
                <div>
                  <h3 className="text-white font-bold">Connect Google Drive to Sync Progress</h3>
                  <p className="text-[#86efac] text-sm">Save your mission status across devices and resume where you left off.</p>
                </div>
              </div>
              <button
                onClick={handleConnect}
                className="px-6 py-2 bg-[#4ade80] text-black font-bold rounded-lg hover:bg-[#22c55e] transition-all shadow-[0_0_15px_rgba(74,222,128,0.2)] whitespace-nowrap"
              >
                Connect Sync
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-2 text-[10px] font-mono text-[#4ade80] uppercase tracking-widest opacity-70">
              <Icons.Cloud size={12} />
              <span>Drive Sync Connected</span>
            </div>
          )}
        </div>

        {/* Header */}
        <div className="text-center mb-16">
          <div className="font-extrabold text-2xl text-[#4ade80] tracking-[0.3em] mb-4">TRIDORIAN</div>
          <h1 className="text-5xl font-extrabold text-white mb-4">Course Catalog</h1>
          <p className="text-lg text-[#86efac] max-w-2xl mx-auto">
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
                className="group text-left w-full bg-[#0a120c] border border-[#1f3d25] rounded-2xl p-8 hover:border-[#4ade80] transition-all duration-300 hover:shadow-[0_0_30px_rgba(74,222,128,0.1)] relative overflow-hidden"
              >
                {/* Hover glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#4ade80]/0 to-[#4ade80]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                <div className="relative flex items-start gap-6">
                  <div className="w-16 h-16 bg-[#132617] rounded-xl flex items-center justify-center border border-[#1f3d25] group-hover:border-[#4ade80] group-hover:shadow-[0_0_15px_rgba(74,222,128,0.2)] transition-all duration-300 flex-shrink-0">
                    <TrackIcon className="text-[#4ade80]" size={32} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-white group-hover:text-[#4ade80] transition-colors">{track.title}</h2>
                        <Icons.ChevronRight className="text-gray-600 group-hover:text-[#4ade80] group-hover:translate-x-1 transition-all" size={24} />
                      </div>
                      {trackProgress[track.id] && (
                        <div className="text-[10px] font-mono text-[#4ade80] border border-[#4ade80]/30 px-2 py-0.5 rounded bg-[#4ade80]/5">
                          {trackProgress[track.id].percentage}% COMPLETE
                        </div>
                      )}
                    </div>
                    <p className="text-[#86efac] text-sm leading-relaxed">{track.description}</p>
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
          Tridorian Learning Platform v1.0
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
