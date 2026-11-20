import { useEffect, useState, type RefObject } from 'react';

/**
 * Returns how far a tall section has been scrolled through, from 0 to 1.
 * Used for the sticky, image-led chapters on the home page.
 */
export function useScrollProgress(ref: RefObject<HTMLElement | null>): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const distance = rect.height - window.innerHeight;
      const next = distance > 0 ? Math.min(1, Math.max(0, -rect.top / distance)) : 0;
      setProgress(next);
    };

    const onScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [ref]);

  return progress;
}

/** Current vertical scroll offset, throttled to animation frames. */
export function useWindowScroll(): number {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let frame = 0;

    const update = () => setOffset(window.scrollY);

    const onScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return offset;
}
