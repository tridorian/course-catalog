import React from 'react';

const LoadingFallback = () => {
  return (
    <div className="min-h-screen bg-base flex items-center justify-center">
      <div className="text-accent-text font-mono animate-pulse text-xl tracking-widest uppercase">
        Loading Tridorian System...
      </div>
    </div>
  );
};

export default LoadingFallback;
