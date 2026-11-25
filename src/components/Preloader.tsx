import React, { useEffect, useState } from 'react';
import { BrandLogo } from './BrandLogo';

const STORAGE_KEY = 'eramora:entered-atelier:v2';

const MIN_DURATION = 400;
const MAX_DURATION = 1100;
const FADE_MS = 280;

function isFirstVisit() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === null;
  } catch {
    return true;
  }
}

export const Preloader: React.FC = () => {
  const [active] = useState(isFirstVisit);
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(!active);

  useEffect(() => {
    if (!active) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      /* storage unavailable — still show the splash once for this load */
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const startedAt = performance.now();
    let frame = 0;
    let finished = false;
    let leaveTimer = 0;
    let removeTimer = 0;

    const finish = () => {
      if (finished) return;
      finished = true;
      window.cancelAnimationFrame(frame);
      setProgress(100);
      leaveTimer = window.setTimeout(() => setLeaving(true), 90);
      removeTimer = window.setTimeout(() => {
        setGone(true);
        document.body.style.overflow = previousOverflow;
      }, 90 + FADE_MS);
    };

    const pageReady = new Promise<void>((resolve) => {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', () => resolve(), { once: true });
    });

    const tick = () => {
      const elapsed = performance.now() - startedAt;
      const nextProgress = Math.min(96, Math.round((elapsed / MIN_DURATION) * 96));
      setProgress((current) => (current === nextProgress ? current : nextProgress));
      if (!finished) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);

    void pageReady.then(() => {
      const remaining = Math.max(0, MIN_DURATION - (performance.now() - startedAt));
      window.setTimeout(finish, remaining);
    });

    const failsafe = window.setTimeout(finish, MAX_DURATION);

    return () => {
      finished = true;
      window.cancelAnimationFrame(frame);
      window.clearTimeout(failsafe);
      window.clearTimeout(leaveTimer);
      window.clearTimeout(removeTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, [active]);

  if (gone) return null;

  return (
    <div
      role="status"
      aria-live="off"
      aria-label="Preparing the ERAMORA atelier"
      className={`splash-screen fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#FAF7F2] transition-opacity ease-out ${
        leaving ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            'radial-gradient(circle at 50% 42%, rgba(197,160,89,0.18) 0%, rgba(250,247,242,0) 58%)',
        }}
      />
      <div className="pointer-events-none absolute inset-x-6 top-6 h-px bg-[#C5A059]/25 md:inset-x-10" />
      <div className="pointer-events-none absolute inset-x-6 bottom-6 h-px bg-[#C5A059]/25 md:inset-x-10" />

      <div className="splash-in relative flex w-full flex-col items-center px-6 text-center">
        <BrandLogo variant="stacked" imgClassName="!h-auto w-[min(76vw,24rem)]" />

        <div className="mt-7 flex w-[min(22rem,76vw)] items-center justify-between gap-6">
          <p className="luxe-eyebrow text-left text-[#6B584C]">Preparing your atelier</p>
          <span className="font-serif text-2xl tabular-nums text-[#2C1E16]" aria-hidden="true">
            {String(Math.round(progress)).padStart(2, '0')}
            <span className="ml-0.5 text-sm text-[#B89352]">%</span>
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Loading ERAMORA"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          className="mt-2 h-px w-[min(22rem,76vw)] overflow-hidden bg-[#2C1E16]/15"
        >
          <div
            className="splash-progress h-full bg-gradient-to-r from-[#8E6C36] via-[#C5A059] to-[#2C1E16]"
            style={{ transform: `scaleX(${progress / 100})` }}
          />
        </div>
        <p className="mt-5 text-[9px] uppercase tracking-[0.28em] text-[#6B584C]/70">
          A moment before the ritual
        </p>
      </div>

      <p className="absolute bottom-10 text-[9px] uppercase tracking-[0.38em] text-[#6B584C]/55">
        Noida · Fine Fragrance House
      </p>
    </div>
  );
};
