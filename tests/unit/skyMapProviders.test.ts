import { describe, expect, it } from 'vitest';
import { getSkyMapUrl } from '../../src/services/skyMapProviders';

describe('sky map providers', () => {
  it('builds coordinate links for every supported provider', () => {
    const providers = ['esa-sky', 'aladin', 'nasa-skyview', 'wwt'] as const;
    for (const provider of providers) {
      const url = new URL(getSkyMapUrl(provider, 219.9204, -60.8351, 'Alpha Centauri'));
      expect(url.protocol).toBe('https:');
      expect(url.href).toMatch(/219\.9204|14\.66136/);
      expect(url.href).toContain('-60.8351');
    }
  });
});
