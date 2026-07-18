import { useEffect } from 'react';
import { ADSENSE } from '../lib/adsense';

/**
 * Injects the Google AdSense script tag dynamically.
 * Only loads when a publisher ID is configured.
 * Place once at the root of your app.
 */
export default function AdSenseScript() {
  useEffect(() => {
    if (!ADSENSE.ENABLED) return;
    if (document.getElementById('adsense-script')) return;

    const script = document.createElement('script');
    script.id = 'adsense-script';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE.PUBLISHER_ID}`;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onerror = () => console.warn('AdSense script failed to load — ads will not render');
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById('adsense-script');
      if (el) el.remove();
    };
  }, []);

  return null;
}
