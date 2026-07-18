import { useEffect, useRef } from 'react';
import { ADSENSE } from '../lib/adsense';

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

interface AdUnitProps {
  /** Unique slot identifier (used for React key) */
  slot: string;
  /** Optional CSS class name */
  className?: string;
  /** Layout format — defaults to 'auto' for responsive */
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  /** Show as a styled card matching the app theme */
  styled?: boolean;
}

/**
 * Google AdSense ad unit component.
 * Renders an <ins> element and triggers AdSense rendering via push().
 * Only renders when ADSENSE.ENABLED is true.
 */
export default function AdUnit({ slot, className = '', format = 'auto', styled = true }: AdUnitProps) {
  const pushedRef = useRef(false);

  useEffect(() => {
    if (!ADSENSE.ENABLED) return;
    if (pushedRef.current) return;

    const timer = setTimeout(() => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushedRef.current = true;
      } catch (e) {
        // AdSense may throw on duplicates — safe to ignore
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      pushedRef.current = false;
    };
  }, []);

  if (!ADSENSE.ENABLED) return null;

  return (
    <div className={`ad-container ${styled ? 'ad-styled' : ''} ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE.PUBLISHER_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
