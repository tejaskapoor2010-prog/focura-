import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2 text-center text-xs font-mono text-zinc-300 flex items-center justify-center gap-2 transition-all">
      <WifiOff className="h-3.5 w-3.5 text-zinc-400 animate-pulse" />
      <span>You are currently offline. Cached study timers, soundscapes, and local notes remain accessible.</span>
    </div>
  );
};
