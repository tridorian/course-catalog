import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { fetchTrackManifest } from '../services/contentLoader';
import { checkUserRole } from '../services/roleManager';

// Simple markdown formatter helper for titles and descriptions
function renderSimpleMarkdown(text) {
  if (typeof text !== 'string') return text;
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="bg-black/40 px-1.5 py-0.5 rounded text-gray-300 font-mono text-xs">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

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
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="text-accent-text font-mono animate-pulse text-xl tracking-widest">
          LOADING TRACK DATA...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-panel border border-red-900/50 rounded-lg p-8 text-center shadow-[0_0_30px_rgba(220,38,38,0.1)]">
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
    <div className="min-h-screen bg-base text-main selection:bg-accent selection:text-accent-fg">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-xs font-mono text-gray-500 hover:text-accent-text transition-colors mb-8 tracking-wider group"
        >
          <Icons.ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          ALL TRACKS
        </button>

        {/* Track Header */}
        <div className="mb-12">
          <div className="text-[10px] font-mono text-gray-600 tracking-widest uppercase mb-3">{track.track_id}</div>
          <h1 className="text-4xl font-extrabold text-white mb-4">{track.title}</h1>
          <p className="text-lg text-text-muted max-w-3xl">{track.description}</p>
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
            const courseLevel = course.level || (course.id.match(/-(\d)/) ? `L${course.id.match(/-(\d)/)[1]}00` : 'L100');
            
            // Level styling helper
            const getLevelStyle = (levelId) => {
              switch (levelId) {
                case 'L100':
                  return {
                    accent: null,
                    borderColor: 'border-border-main hover:border-accent',
                    glow: 'shadow-accent hover:shadow-accent',
                    bgGlow: 'from-accent/0 to-accent/5',
                    badgeBg: 'bg-muted text-accent-text border-border-main',
                    label: 'L100 Core'
                  };
                case 'L200':
                  return {
                    accent: '#06b6d4',
                    borderColor: 'border-[#083344] hover:border-[#06b6d4]',
                    glow: 'shadow-[0_0_20px_rgba(6,182,212,0.05)] hover:shadow-[0_0_25px_rgba(6,182,212,0.15)]',
                    bgGlow: 'from-[#06b6d4]/0 to-[#06b6d4]/5',
                    badgeBg: 'bg-[#081e29] text-[#06b6d4] border-[#083344]',
                    label: 'L200 Elective'
                  };
                case 'L300':
                  return {
                    accent: '#3b82f6',
                    borderColor: 'border-[#172554] hover:border-[#3b82f6]',
                    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.05)] hover:shadow-[0_0_25px_rgba(59,130,246,0.15)]',
                    bgGlow: 'from-[#3b82f6]/0 to-[#3b82f6]/5',
                    badgeBg: 'bg-[#0f1d3a] text-[#3b82f6] border-[#172554]',
                    label: 'L300 Advanced'
                  };
                case 'L400':
                  return {
                    accent: '#a855f7',
                    borderColor: 'border-[#3b0764] hover:border-[#a855f7]',
                    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.05)] hover:shadow-[0_0_25px_rgba(168,85,247,0.15)]',
                    bgGlow: 'from-[#a855f7]/0 to-[#a855f7]/5',
                    badgeBg: 'bg-[#220c38] text-[#a855f7] border-[#3b0764]',
                    label: 'L400 Enterprise'
                  };
                default:
                  return {
                    accent: null,
                    borderColor: 'border-border-main hover:border-accent',
                    glow: 'shadow-accent hover:shadow-accent',
                    bgGlow: 'from-accent/0 to-accent/5',
                    badgeBg: 'bg-muted text-accent-text border-border-main',
                    label: 'L100 Core'
                  };
              }
            };

            const style = getLevelStyle(courseLevel);

            return (
              <button
                key={course.id}
                onClick={() => navigate(`/${trackId}/${course.id}`)}
                className={`group text-left bg-panel border ${style.borderColor} rounded-xl p-6 transition-all duration-300 ${style.glow} relative overflow-hidden flex flex-col justify-between`}
              >
                {/* Hover glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${style.bgGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}></div>

                <div className="relative flex flex-col h-full justify-between w-full">
                  <div>
                    {/* Top Tag Row */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex gap-2">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${style.badgeBg} uppercase tracking-wider`}>
                          {style.label}
                        </span>
                        {course.duration && (
                          <span className="text-[10px] font-mono text-gray-500 bg-base px-2 py-0.5 rounded border border-border-main flex items-center gap-1">
                            <Icons.Clock size={10} /> {course.duration} mins
                          </span>
                        )}
                      </div>
                      
                      <div className="text-[10px] font-mono text-gray-600 tracking-wider">
                        {course.id.toUpperCase()}
                      </div>
                    </div>

                    {/* Course Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300 flex-shrink-0"
                        style={{ 
                          backgroundColor: style.accent ? `${style.accent}12` : 'var(--accent-muted)', 
                          borderColor: style.accent ? `${style.accent}33` : 'var(--accent-border)',
                        }}
                      >
                        <CourseIcon style={{ color: style.accent || 'var(--accent-bg)' }} size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-white transition-colors leading-tight">
                          {renderSimpleMarkdown(course.title)}
                        </h3>
                      </div>
                    </div>

                    {/* Abstract / Description */}
                    <p className="text-sm text-text-muted mb-5 leading-relaxed font-light opacity-90 group-hover:opacity-100 transition-opacity">
                      {renderSimpleMarkdown(course.description)}
                    </p>

                    {/* Tags List */}
                    {course.tags && course.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {course.tags.map((tag, i) => (
                          <span key={i} className="text-[10px] font-mono text-gray-400 bg-black/40 px-2 py-0.5 rounded border border-border-subtle">
                            #{tag.toLowerCase()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Progress and Footer */}
                  <div className="mt-auto w-full">
                    {progress && (
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] font-mono uppercase tracking-wider text-gray-500">Progress</span>
                          <span className="text-[9px] font-mono text-gray-400">{progress.percentage}%</span>
                        </div>
                        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full shadow-accent"
                            style={{ 
                              width: `${progress.percentage}%`,
                              backgroundColor: style.accent || 'var(--accent-bg)'
                            }}
                          ></div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-border-subtle pt-4 mt-2">
                      <span className="text-[10px] font-mono text-gray-500 tracking-wider flex items-center gap-1.5">
                        <Icons.Layers size={12} />
                        {course.modules} MODULES {isCompleted && <span className="text-accent-text font-bold">// COMPLETED</span>}
                      </span>
                      <span 
                        className="flex items-center gap-1 text-xs font-medium transition-colors"
                        style={{ color: style.accent || 'var(--accent-text)' }}
                      >
                        {progress ? 'Resume Mission' : 'Start Mission'} 
                        <Icons.ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
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
