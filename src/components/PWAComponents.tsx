import React, { useEffect, useState } from 'react';
import { Download, Share, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [installError, setInstallError] = useState(false);

  useEffect(() => {
    if (isInstalled || (!isInstallable && !isIOS)) {
      setIsVisible(false);
      return;
    }

    const showTimer = window.setTimeout(() => setIsVisible(true), 700);
    return () => window.clearTimeout(showTimer);
  }, [isInstallable, isInstalled, isIOS]);

  useEffect(() => {
    if (!isVisible || isPaused) return;

    const hideTimer = window.setTimeout(() => setIsVisible(false), 5000);
    return () => window.clearTimeout(hideTimer);
  }, [isVisible, isPaused]);

  if (isInstalled) return null;

  const handleInstall = async () => {
    setIsVisible(false);
    setInstallError(false);
    if (isIOS && !isInstallable) {
      setShowGuide(true);
      return;
    }
    try {
      await install();
    } catch (error) {
      console.error('ERAMORA app installation prompt failed:', error);
      setInstallError(true);
      setIsVisible(true);
    }
  };

  return (
    <>
      {isVisible && (
        <aside
          aria-live="polite"
          aria-label="Install ERAMORA app"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-4 z-[60] w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-[#C5A059]/35 bg-[#FAF7F2] p-4 text-[#2C1E16] shadow-xl md:bottom-5"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2C1E16] text-[#C5A059]">
              {isIOS && !isInstallable ? (
                <Share className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Download className="h-4 w-4" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-serif text-[17px] leading-tight">Install ERAMORA</p>
              <p className="mt-1 text-xs leading-relaxed text-[#6B584C]">
                {installError
                  ? 'The install prompt could not be opened. Please try again later.'
                  : isIOS && !isInstallable
                  ? 'Add the fragrance atelier to your Home Screen.'
                  : 'Enjoy a quicker, app-like shopping experience.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsVisible(false)}
              aria-label="Dismiss install suggestion"
              className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#6B584C] transition-colors hover:bg-[#2C1E16]/5 hover:text-[#2C1E16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => void handleInstall()}
            className="mt-3 w-full rounded-lg bg-[#2C1E16] px-4 py-2.5 text-xs font-medium uppercase tracking-[0.16em] text-[#FAF7F2] transition-colors hover:bg-[#3F2C21] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352] focus-visible:ring-offset-2"
          >
            {isIOS && !isInstallable ? 'How to install' : 'Install app'}
          </button>
        </aside>
      )}

      {showGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Install ERAMORA on iOS"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#2C1E16]/60 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-sm border border-[#2C1E16]/15 bg-[#FAF7F2] p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-serif text-xl text-[#2C1E16]">Add ERAMORA to Home Screen</h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close installation guide"
                className="p-1 text-[#6B584C] hover:text-[#2C1E16]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ol className="mt-4 list-inside list-decimal space-y-2.5 text-sm text-[#6B584C]">
              <li>Tap the Share button in your Safari browser toolbar.</li>
              <li>Scroll down and choose <strong>Add to Home Screen</strong>.</li>
              <li>Tap <strong>Add</strong> to launch ERAMORA as a standalone app.</li>
            </ol>
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full bg-[#2C1E16] py-2.5 text-xs font-medium uppercase tracking-widest text-[#FAF7F2] hover:bg-[#3F2C21]"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 md:bottom-5 left-4 z-50 flex items-center gap-2 bg-[#2C1E16] text-[#FAF7F2] px-3.5 py-2 text-xs border border-[#C5A059]/40 shadow-md"
    >
      <WifiOff className="w-3.5 h-3.5 text-[#C5A059]" />
      <span>Offline Mode — Viewing cached ERAMORA catalogue</span>
    </div>
  );
};
