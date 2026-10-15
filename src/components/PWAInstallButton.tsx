import React, { useState } from 'react';
import { Download, Smartphone, Check, X, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'compact' | 'full';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  // If already installed into standalone mode, show clean installed state or hide
  if (isInstalled) {
    if (variant === 'full') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 text-xs text-zinc-400 font-mono">
          <Check className="h-3.5 w-3.5 text-emerald-400" />
          <span>App Installed</span>
        </div>
      );
    }
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setJustInstalled(true);
      }
    } else {
      // Either iOS or browser where beforeinstallprompt hasn't fired yet
      setShowGuide(true);
    }
  };

  if (justInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-emerald-400 font-medium">
        <Check className="h-3.5 w-3.5" />
        <span>Installed!</span>
      </div>
    );
  }

  return (
    <>
      {variant === 'header' && (
        <button
          onClick={handleClick}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-700 bg-zinc-900 text-white hover:bg-white hover:text-black hover:border-white transition-all shadow-sm group ${className}`}
          title="Install Focura as App"
          aria-label="Install Focura Application"
        >
          <Download className="h-3.5 w-3.5 group-hover:translate-y-0.5 transition-transform" />
          <span className="hidden sm:inline font-semibold">Install App</span>
          <span className="sm:hidden font-semibold">Install</span>
        </button>
      )}

      {variant === 'compact' && (
        <button
          onClick={handleClick}
          className={`p-2 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors ${className}`}
          title="Install Focura App"
          aria-label="Install App"
        >
          <Download className="h-4 w-4" />
        </button>
      )}

      {variant === 'full' && (
        <button
          onClick={handleClick}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-200 active:scale-[0.99] transition shadow-lg ${className}`}
        >
          <Download className="h-4 w-4" />
          <span>Install Focura Application</span>
        </button>
      )}

      {/* Instructional Guide Modal for iOS or desktop browser */}
      {showGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setShowGuide(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white">
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Install Focura</h3>
                <p className="text-xs text-zinc-400">Run as a standalone desktop or mobile app</p>
              </div>
            </div>

            {isIOS ? (
              <div className="space-y-3.5 text-xs text-zinc-300 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80">
                <p className="font-semibold text-white">Instructions for iPhone & iPad (Safari):</p>
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white text-black font-bold flex items-center justify-center text-[10px]">1</span>
                  <div className="flex items-center gap-1.5">
                    <span>Tap the Safari <strong>Share</strong> button</span>
                    <Share2 className="h-3.5 w-3.5 text-zinc-400 inline" />
                    <span>at the bottom of your screen.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white text-black font-bold flex items-center justify-center text-[10px]">2</span>
                  <div className="flex items-center gap-1.5">
                    <span>Scroll down and select <strong>Add to Home Screen</strong></span>
                    <PlusSquare className="h-3.5 w-3.5 text-zinc-400 inline" />.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white text-black font-bold flex items-center justify-center text-[10px]">3</span>
                  <span>Tap <strong>Add</strong> in the top right corner. Focura will launch full-screen!</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-zinc-300 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80">
                <p className="font-semibold text-white">Install on Chrome / Edge / Android:</p>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-white text-black font-bold flex items-center justify-center text-[10px] flex-shrink-0">1</span>
                  <span>Look for the <strong>Install</strong> icon in your browser's address bar or tap the three dots menu (⋮).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-white text-black font-bold flex items-center justify-center text-[10px] flex-shrink-0">2</span>
                  <span>Click <strong>"Install Focura"</strong> to add it to your desktop or home screen.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-white text-black font-bold flex items-center justify-center text-[10px] flex-shrink-0">3</span>
                  <span>Enjoy distraction-free study sessions without browser tabs or address bars!</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
