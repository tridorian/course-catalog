import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { fetchTrackManifest } from '../services/contentLoader';
import { checkUserRole } from '../services/roleManager';

const TrackPage = () => {
  const { trackId } = useParams();
  const navigate = useNavigate();
  const [track, setTrack] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courseProgress, setCourseProgress] = useState({});
  const [role, setRole] = useState('student');

  useEffect(() => {
    async function loadTrack() {
      setIsLoading(true);
      setError(null);
      try {
        const [data, userRole] = await Promise.all([
          fetchTrackManifest(trackId),
          checkUserRole()
        ]);
        setTrack(data);
        setRole(userRole);

        // Load local progress
        const localProgress = JSON.parse(localStorage.getItem('agy_local_progress') || '{}');
        const progressMap = {};
        data.courses.forEach(course => {
          const courseProg = localProgress[`${trackId}_${course.id}`];
          if (courseProg && courseProg.completedIndices) {
            const completedCount = courseProg.completedIndices.length;
            progressMap[course.id] = {
              completed: completedCount,
              total: course.modules,
              percentage: Math.round((completedCount / course.modules) * 100)
            };
          }
        });
        setCourseProgress(progressMap);
      } catch (err) {
        console.error('Failed to load track:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    loadTrack();
  }, [trackId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050805] flex items-center justify-center">
        <div className="text-[#4ade80] font-mono animate-pulse text-xl tracking-widest">
          LOADING TRACK DATA...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050805] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#0a120c] border border-red-900/50 rounded-lg p-8 text-center shadow-[0_0_30px_rgba(220,38,38,0.1)]">
          <Icons.AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-500 mb-2 uppercase tracking-tighter">Track Not Found</h2>
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

  return (
    <div className="min-h-screen bg-[#050805] text-[#f0fdf4] selection:bg-[#4ade80] selection:text-black">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#4ade80]/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-xs font-mono text-gray-500 hover:text-[#4ade80] transition-colors mb-8 tracking-wider group"
        >
          <Icons.ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          ALL TRACKS
        </button>

        {/* Track Header */}
        <div className="mb-12">
          <div className="text-[10px] font-mono text-gray-600 tracking-widest uppercase mb-3">{track.track_id}</div>
          <h1 className="text-4xl font-extrabold text-white mb-4">{track.title}</h1>
          <p className="text-lg text-[#86efac] max-w-3xl">{track.description}</p>
          <div className="mt-4 text-xs font-mono text-gray-500">
            {track.courses.length} {track.courses.length === 1 ? 'course' : 'courses'} available
          </div>
        </div>

        {/* Course Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {track.courses
            .filter(course => role === 'admin' || course.status !== 'Draft')
            .map((course, index) => {
            const CourseIcon = Icons[course.icon] || Icons.BookOpen;
            const progress = courseProgress[course.id];
            const isCompleted = progress && progress.completed === progress.total;

            return (
              <button
                key={course.id}
                onClick={() => navigate(`/${trackId}/${course.id}`)}
                className="group text-left bg-[#0a120c] border border-[#1f3d25] rounded-xl p-6 hover:border-[#4ade80] transition-all duration-300 hover:shadow-[0_0_20px_rgba(74,222,128,0.1)] relative overflow-hidden"
              >
                {/* Hover glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#4ade80]/0 to-[#4ade80]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                <div className="relative">
                  {/* Course number badge */}
                  <div className="absolute -top-1 -right-1 w-8 h-8 bg-[#132617] rounded-lg flex items-center justify-center border border-[#1f3d25] text-xs font-mono text-gray-500">
                    {String(index + 1).padStart(2, '0')}
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-[#132617] rounded-lg flex items-center justify-center border border-[#1f3d25] group-hover:border-[#4ade80] transition-colors">
                      <CourseIcon className="text-[#4ade80]" size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-[#4ade80] transition-colors">{course.title}</h3>
                  </div>

                  <p className="text-sm text-[#86efac] mb-4 leading-relaxed">{course.description}</p>

                  {progress && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-mono text-[#4ade80] uppercase tracking-wider">Progress</span>
                        <span className="text-[10px] font-mono text-[#4ade80]">{progress.percentage}%</span>
                      </div>
                      <div className="h-1 w-full bg-[#132617] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#4ade80] shadow-[0_0_5px_#4ade80]"
                          style={{ width: `${progress.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-gray-500 tracking-wider">
                      {course.modules} MODULES {isCompleted && <span className="text-[#4ade80] ml-2 font-bold">// COMPLETED</span>}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500 group-hover:text-[#4ade80] transition-colors">
                      {progress ? 'Resume Mission' : 'Start Mission'} <Icons.ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TrackPage;
