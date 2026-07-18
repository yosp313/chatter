/**
 * Google AdSense Configuration
 *
 * To enable ads:
 * 1. Sign up at https://adsense.google.com/ and get your publisher ID
 * 2. Replace the empty string below with your ID (e.g. 'ca-pub-1234567890123456')
 */
export const ADSENSE = {
  /** Your AdSense publisher ID — set this to enable ads */
  PUBLISHER_ID: 'ca-pub-6770811259467826',

  /** Whether ads are enabled */
  get ENABLED() {
    return this.PUBLISHER_ID.length > 0;
  },
};
