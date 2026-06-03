import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import ThemePicker from './ThemePicker';
import CodeBlock from './CodeBlock';

const HelpSection = ({ theme, setTheme }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('sync');

  const topics = [
    {
      id: 'sync',
      title: 'Google Drive Sync',
      icon: 'Cloud',
      subtitle: 'Keep your progress synced across all devices.',
      content: (
        <div className="space-y-6">
          <div className="bg-muted/30 border border-border-main rounded-xl p-6">
            <h3 className="text-lg font-bold text-main mb-3 flex items-center gap-2">
              <Icons.Cloud className="text-accent-text" size={20} />
              Connecting to Google Drive
            </h3>
            <p className="text-text-muted text-sm leading-relaxed mb-4">
              To persist your learning progress across different browser sessions and devices, you can link the platform to your Google Drive account. This creates an isolated file in your Drive appdata folder, keeping your credentials secure and private.
            </p>
            <div className="border border-border-main rounded-lg overflow-hidden bg-black/40 mb-4 shadow-lg">
              <img
                src="/assets/screenshots/dashboard-disconnected.png"
                alt="Connect Google Drive Onboarding Banner"
                className="w-full object-cover border-b border-border-main opacity-90 hover:opacity-100 transition-opacity duration-300"
              />
              <div className="p-3 bg-panel text-xs font-mono text-text-muted opacity-80">
                Figure 1: Onboarding banner visible when disconnected from Google Drive.
              </div>
            </div>
            <div className="border border-border-main rounded-lg overflow-hidden bg-black/40 shadow-lg">
              <img
                src="/assets/screenshots/dashboard-connected.png"
                alt="Connected Google Drive State"
                className="w-full object-cover border-b border-border-main opacity-90 hover:opacity-100 transition-opacity duration-300"
              />
              <div className="p-3 bg-panel text-xs font-mono text-text-muted opacity-80">
                Figure 2: Sync status badge confirming active connection.
              </div>
            </div>
          </div>

          <div className="bg-muted/30 border border-border-main rounded-xl p-6">
            <h3 className="text-lg font-bold text-main mb-3 flex items-center gap-2">
              <Icons.WifiOff className="text-accent-text" size={20} />
              Offline Operations & Queuing
            </h3>
            <p className="text-text-muted text-sm leading-relaxed">
              If your internet connection drops while working on a course, the catalog app automatically caches your progress locally. It queues updates in a local offline queue and syncs them automatically to your Google Drive progress file the moment your network connection is restored.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'navigation',
      title: 'Course Progression',
      icon: 'Map',
      subtitle: 'Unlock modules and navigate the course map.',
      content: (
        <div className="space-y-6">
          <div className="bg-muted/30 border border-border-main rounded-xl p-6">
            <h3 className="text-lg font-bold text-main mb-3 flex items-center gap-2">
              <Icons.Lock className="text-accent-text" size={20} />
              Locked Modules & Prerequisites
            </h3>
            <p className="text-text-muted text-sm leading-relaxed mb-4">
              Courses are designed as linear learning progressions. Modules will appear locked until you complete all previous modules in the course. Completing a module automatically unlocks the subsequent one.
            </p>
            <div className="border border-border-main rounded-lg overflow-hidden bg-black/40 mb-4 shadow-lg">
              <img
                src="/assets/screenshots/course-map.png"
                alt="Track Course Map"
                className="w-full object-cover border-b border-border-main opacity-90 hover:opacity-100 transition-opacity duration-300"
              />
              <div className="p-3 bg-panel text-xs font-mono text-text-muted opacity-80">
                Figure 3: Interactive Course Map displaying progression status.
              </div>
            </div>
            <div className="border border-border-main rounded-lg overflow-hidden bg-black/40 shadow-lg">
              <img
                src="/assets/screenshots/module-view.png"
                alt="Module Step Renderer with Sidebar Progress"
                className="w-full object-cover border-b border-border-main opacity-90 hover:opacity-100 transition-opacity duration-300"
              />
              <div className="p-3 bg-panel text-xs font-mono text-text-muted opacity-80">
                Figure 4: Course player view with sidebar navigation and module checks.
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'reset',
      title: 'Resetting Progress',
      icon: 'RotateCcw',
      subtitle: 'Wipe progress history to retake a course.',
      content: (
        <div className="space-y-6">
          <div className="bg-muted/30 border border-border-main rounded-xl p-6">
            <h3 className="text-lg font-bold text-main mb-3 flex items-center gap-2">
              <Icons.RotateCcw className="text-accent-text" size={20} />
              Resetting Track and Course Status
            </h3>
            <p className="text-text-muted text-sm leading-relaxed mb-4">
              If you want to start a course from scratch, you can reset your progress. This will clear the locally cached progress for the course and update the remote Google Drive file accordingly.
            </p>
            <div className="border border-border-main rounded-lg overflow-hidden bg-black/40 mb-4 shadow-lg">
              <img
                src="/assets/screenshots/reset-modal.png"
                alt="Reset Progress Confirmation Modal"
                className="w-full object-cover border-b border-border-main opacity-90 hover:opacity-100 transition-opacity duration-300"
              />
              <div className="p-3 bg-panel text-xs font-mono text-text-muted opacity-80">
                Figure 5: Confirmation dialog that prevents accidental data wipe.
              </div>
            </div>
            <p className="text-text-muted text-xs leading-relaxed italic opacity-85">
              Note: Resetting is permanent and cannot be undone. Once confirmed, you will need to retake the modules in sequence to unlock them.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'author-sync',
      title: 'Content Creator Sync',
      icon: 'Database',
      subtitle: 'Sync course curriculum from Google Docs to the repository.',
      content: (
        <div className="space-y-6">
          <div className="bg-muted/30 border border-border-main rounded-xl p-6">
            <h3 className="text-lg font-bold text-main mb-3 flex items-center gap-2">
              <Icons.Database className="text-accent-text" size={20} />
              Docs to Repository Compilation
            </h3>
            <p className="text-text-muted text-sm leading-relaxed mb-4">
              Course content is authored in Google Docs (with dedicated tabs for the Config, Intro, and Modules). To synchronize the latest revisions into the local catalog codebase:
            </p>
            <ol className="list-decimal pl-6 space-y-4 text-sm text-text-muted">
              <li>
                Verify that your course configuration maps correctly in <code className="text-accent-text font-mono bg-muted px-1 py-0.5 rounded">scripts/sync-config.json</code>.
              </li>
              <li>
                Ensure you are authenticated with Google Cloud Platform locally by running:
                <CodeBlock language="bash" code="gcloud auth application-default login" />
              </li>
              <li>
                Execute the sync-docs script to fetch and compile all configured course documents:
                <CodeBlock language="bash" code="node scripts/sync-docs.js" />
              </li>
              <li>
                To sync courses marked with <code className="text-accent-text font-mono bg-muted px-1 py-0.5 rounded">Status: Draft</code>, append the draft bypass environment variable:
                <CodeBlock language="bash" code="SYNC_DRAFT=true node scripts/sync-docs.js" />
              </li>
            </ol>
            <p className="text-text-muted text-xs mt-6 leading-relaxed italic border-t border-border-main pt-4">
              Note: The sync script reads the document structures, parses heading types and layouts, and updates the local course JSON content automatically.
            </p>
          </div>

          <div className="bg-muted/30 border border-border-main rounded-xl p-6">
            <h3 className="text-lg font-bold text-main mb-3 flex items-center gap-2">
              <Icons.Send className="text-accent-text" size={20} />
              Pushing Local Edits back to Google Docs
            </h3>
            <p className="text-text-muted text-sm leading-relaxed mb-4">
              If you make changes to local JSON course files (e.g. via local subagent edits or manual refinements) and wish to populate those modifications back into the online template:
            </p>
            <CodeBlock language="bash" code="node scripts/populate-course-doc.js --docId [GoogleDocID] --data [PathToCourseJSON]" />
          </div>
        </div>
      )
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting Guide',
      icon: 'HelpCircle',
      subtitle: 'Resolve common errors and stuck states.',
      content: (
        <div className="space-y-6">
          <div className="bg-muted/30 border border-border-main rounded-xl p-6 space-y-6">
            <div>
              <h4 className="text-main font-bold mb-2 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Icons.AlertCircle className="text-red-400" size={16} />
                Drive Syncing Status Displays "Error"
              </h4>
              <p className="text-text-muted text-sm leading-relaxed pl-6">
                This occurs when the app fails to authenticate or lacks network access to the Google Drive API. Click the <strong>Retry Sync</strong> button next to the sync status indicator, or try refreshing the page to trigger a re-authorization prompt.
              </p>
            </div>

            <div className="border-t border-border-main pt-6">
              <h4 className="text-main font-bold mb-2 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Icons.AlertCircle className="text-red-400" size={16} />
                "Failed to fetch user info" Console Log or Error Screen
              </h4>
              <p className="text-text-muted text-sm leading-relaxed pl-6">
                This is typically caused by third-party cookie restrictions or conflicting active Google accounts. Open the application in a new <strong>Incognito or Private window</strong>, connect to Google Drive there, and check if the error is resolved.
              </p>
            </div>

            <div className="border-t border-border-main pt-6">
              <h4 className="text-main font-bold mb-2 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Icons.AlertCircle className="text-red-400" size={16} />
                Course Module Remains Locked After Completing Prior Step
              </h4>
              <p className="text-text-muted text-sm leading-relaxed pl-6">
                Ensure you click the <strong>Next</strong> button at the bottom of the course page to register the completion event, or explicitly click the checkbox next to the module name in the sidebar layout.
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const activeTopic = topics.find(t => t.id === activeTab) || topics[0];
  const ActiveIcon = Icons[activeTopic.icon] || Icons.HelpCircle;

  return (
    <div className="min-h-screen bg-base text-main selection:bg-accent selection:text-accent-fg relative overflow-hidden">
      <div className="theme-pattern-grid" />
      {/* Subtle Background Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-8 md:py-12">
        {/* Top Controls Row */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 border-b border-border-subtle pb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xs font-mono text-gray-500 hover:text-accent-text transition-colors tracking-wider group"
          >
            <Icons.ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            BACK TO CATALOG
          </button>
          <div className="flex items-center gap-3">
            <ThemePicker theme={theme} setTheme={setTheme} />
          </div>
        </div>

        {/* Page Title */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <Icons.HelpCircle className="text-accent-text" size={36} />
            <h1 className="text-4xl font-extrabold text-main tracking-tight">Help & Troubleshooting</h1>
          </div>
          <p className="text-text-muted text-sm max-w-2xl">
            Detailed walkthroughs, sync instructions, and answers to common troubleshooting scenarios to help you navigate your Tridorian mission.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1 space-y-2">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Help Categories</h2>
            {topics.map((topic) => {
              const Icon = Icons[topic.icon] || Icons.HelpCircle;
              const isActive = topic.id === activeTab;
              return (
                <button
                  key={topic.id}
                  onClick={() => setActiveTab(topic.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-3 relative border ${
                    isActive
                      ? 'bg-muted text-accent-text border-border-main shadow-accent'
                      : 'text-text-muted border-transparent hover:bg-muted/40 hover:text-main'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-accent-text' : 'text-gray-500'} />
                  <span>{topic.title}</span>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent rounded-r-full shadow-accent"></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3 space-y-6">
            <div className="border-b border-border-main pb-4 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <ActiveIcon className="text-accent-text" size={24} />
                <h2 className="text-2xl font-bold text-main">{activeTopic.title}</h2>
              </div>
              <p className="text-text-muted text-sm font-light">{activeTopic.subtitle}</p>
            </div>
            
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {activeTopic.content}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-20 border-t border-border-main pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-text-muted opacity-80">
          <span>Tridorian User Guide & Troubleshooting Manual</span>
          <span className="hover:text-accent-text transition-colors cursor-pointer" onClick={() => navigate('/')}>
            Return to Dashboard
          </span>
        </div>
      </div>
    </div>
  );
};

export default HelpSection;
