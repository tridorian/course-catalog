import React from 'react';
import * as Icons from 'lucide-react';

export default function ProfileModal({ isOpen, onClose, catalog }) {
  if (!isOpen || !catalog) return null;

  // Retrieve local progress
  const localProgress = JSON.parse(localStorage.getItem('agy_local_progress') || '{}');

  const completedTracks = [];
  const completedCourses = [];
  const activeCourses = [];

  catalog.tracks.forEach(track => {
    let trackCompleted = true;
    let trackHasProgress = false;

    track.courses.forEach(course => {
      const courseProg = localProgress[`${track.id}_${course.id}`];
      const completedCount = courseProg && courseProg.completedIndices ? courseProg.completedIndices.length : 0;
      const totalModules = course.modules || 0;
      const pct = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

      const courseInfo = {
        ...course,
        trackId: track.id,
        trackTitle: track.title,
        completedCount,
        totalModules,
        percentage: pct
      };

      if (pct === 100 && totalModules > 0) {
        completedCourses.push(courseInfo);
        trackHasProgress = true;
      } else if (pct > 0) {
        activeCourses.push(courseInfo);
        trackHasProgress = true;
        trackCompleted = false;
      } else {
        trackCompleted = false;
      }
    });

    if (trackCompleted && track.courses.length > 0) {
      completedTracks.push(track);
    }
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-panel border border-border-main w-full max-w-2xl rounded-2xl shadow-elevated overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        style={{
          boxShadow: 'var(--shadow-accent), 0 25px 50px -12px rgba(0,0,0,0.7)'
        }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-border-subtle flex items-center justify-between bg-muted/30">
          <h2 className="text-lg font-black text-main uppercase tracking-widest flex items-center gap-2.5">
            <Icons.Award className="text-accent-text" size={18} />
            My Profile & Achievements
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-muted border border-transparent hover:border-border-main rounded-md text-text-muted hover:text-main transition-all"
            data-testid="profile-close-button"
          >
            <Icons.X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
          
          {/* Summary / Stats */}
          <div className="grid grid-cols-3 gap-4 border-b border-border-subtle pb-6">
            <div className="bg-muted/20 border border-border-subtle rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-main">{completedTracks.length}</div>
              <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mt-1">Completed Tracks</div>
            </div>
            <div className="bg-muted/20 border border-border-subtle rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-main">{completedCourses.length}</div>
              <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mt-1">Completed Courses</div>
            </div>
            <div className="bg-muted/20 border border-border-subtle rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-main">{activeCourses.length}</div>
              <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mt-1">Courses In Progress</div>
            </div>
          </div>

          {/* Completed Tracks */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-border-subtle pb-2">Track Badges</h3>
            {completedTracks.length === 0 ? (
              <p className="text-xs text-text-muted italic">No tracks completed yet. Finish all courses in a track to unlock its badge!</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {completedTracks.map(track => (
                  <div 
                    key={track.id} 
                    className="bg-muted/20 border border-accent-border rounded-xl p-4 flex flex-col items-center text-center shadow-sm relative overflow-hidden group hover:-translate-y-0.5 transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent-border flex items-center justify-center mb-3">
                      <Icons.ShieldCheck className="text-accent-text" size={24} />
                    </div>
                    <span className="text-xs font-bold text-main tracking-tight uppercase">{track.title}</span>
                    <span className="text-[9px] font-mono text-accent-text mt-1 uppercase tracking-widest">Master</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Courses */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-border-subtle pb-2">Completed Courses</h3>
            {completedCourses.length === 0 ? (
              <p className="text-xs text-text-muted italic">No courses completed yet. Complete all modules in a course to earn its certificate.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {completedCourses.map(course => (
                  <div 
                    key={course.id} 
                    className="bg-muted/10 border border-border-subtle rounded-xl p-4 flex items-center gap-4 hover:border-accent-border transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center shrink-0">
                      <Icons.CheckCircle className="text-green-500" size={20} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold text-main truncate uppercase tracking-tight">{course.title}</h4>
                      <p className="text-[9px] text-text-muted font-mono uppercase tracking-wider truncate mt-0.5">{course.trackTitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Courses */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-border-subtle pb-2">Active Progression</h3>
            {activeCourses.length === 0 ? (
              <p className="text-xs text-text-muted italic">No active courses in progress.</p>
            ) : (
              <div className="space-y-3">
                {activeCourses.map(course => (
                  <div key={course.id} className="bg-muted/10 border border-border-subtle rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-extrabold text-main uppercase tracking-tight">{course.title}</span>
                      <span className="font-mono text-accent-text">{course.percentage}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent progress-bar-fill transition-all duration-300"
                        style={{ width: `${course.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[9px] text-text-muted font-mono uppercase tracking-wider">
                      <span>{course.trackTitle}</span>
                      <span>{course.completedCount} / {course.totalModules} Modules</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-subtle bg-muted/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-accent text-accent-fg font-black text-xs uppercase tracking-widest rounded-lg hover:brightness-110 active:scale-[0.98] transition-all"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}
