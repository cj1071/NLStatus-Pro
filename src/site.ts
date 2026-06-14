export const SITE_CONFIG = {
  domain: 'www.nodeloc.com',
  name: 'NodeLoc',
  icon: 'https://www.nodeloc.com/uploads/default/optimized/2X/4/462daf57742c4efd87015ab0e11fb29b95915e56_2_32x32.png',
  origin: 'https://www.nodeloc.com',
} as const;

export interface SiteConfig {
  domain: string;
  name: string;
  icon: string;
  origin: string;
}

export function detectSite(): SiteConfig | null {
  const hostname = window.location.hostname;
  if (hostname === 'www.nodeloc.com' || hostname === 'nodeloc.com' || hostname === 'nodeloc.cc') {
    return { ...SITE_CONFIG, origin: `https://${hostname}` };
  }
  return null;
}

export const CURRENT_SITE = detectSite();
