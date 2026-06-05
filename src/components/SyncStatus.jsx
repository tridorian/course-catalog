
import React from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle } from 'lucide-react';

const SyncStatus = ({ status, onRetry }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'synced':
        return {
          icon: <CheckCircle size={16} className="text-accent-text" aria-hidden="true" />,
          text: 'Synced',
          tooltip: 'All changes saved to Google Drive',
          color: 'text-accent-text',
          bg: 'bg-accent/10',
          border: 'border-accent-border'
        };
      case 'syncing':
        return {
          icon: <Cloud size={16} className="text-[#f59e0b] animate-pulse" aria-hidden="true" />,
          text: 'Syncing',
          tooltip: 'Saving changes...',
          color: 'text-[#f59e0b]',
          bg: 'bg-[#f59e0b]/10',
          border: 'border-[#f59e0b]/20'
        };
      case 'error':
        return {
          icon: <CloudOff size={16} className="text-[#ef4444]" aria-hidden="true" />,
          text: 'Error',
          tooltip: 'Sync failed. Click to retry.',
          color: 'text-[#ef4444]',
          bg: 'bg-[#ef4444]/10',
          border: 'border-[#ef4444]/20',
          clickable: true
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  return (
    <div 
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bg} ${config.border} ${config.clickable ? 'cursor-pointer hover:bg-red-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500' : ''} transition-all duration-200`}
      title={config.tooltip}
      onClick={config.clickable ? onRetry : undefined}
      onKeyDown={(e) => {
        if (config.clickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onRetry();
        }
      }}
      role={config.clickable ? "button" : "status"}
      tabIndex={config.clickable ? 0 : undefined}
      aria-label={config.tooltip}
      data-testid={`sync-status-${status}`}
    >
      {config.icon}
      <span className={`text-[10px] font-mono uppercase font-bold tracking-wider ${config.color}`}>
        {config.text}
      </span>
      {config.clickable && <RefreshCw size={10} className={`${config.color} animate-spin-slow`} aria-hidden="true" />}
    </div>
  );
};

export default SyncStatus;
