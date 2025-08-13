"use client";

import { useEffect } from 'react';

export default function FaviconHydrator() {
  useEffect(() => {
    const ensureFavicon = (rel: string, href: string, type?: string) => {
      const selector = `link[rel="${rel}"]`;
      const existing = document.head.querySelector(selector) as HTMLLinkElement | null;
      if (!existing) {
        const link = document.createElement('link');
        link.rel = rel as HTMLLinkElement['rel'];
        link.href = href;
        if (type) link.type = type;
        document.head.appendChild(link);
      }
    };

    // Prefer Next.js app icon if present
    const preferredSvg = '/icon.svg';
    const fallbackSvg = '/favicon.svg?v=2';
    const ico = '/favicon.ico?v=2';

    // Try to ensure at least one SVG favicon and an ICO fallback
    ensureFavicon('icon', preferredSvg, 'image/svg+xml');
    ensureFavicon('icon', fallbackSvg, 'image/svg+xml');
    ensureFavicon('icon', ico);
    ensureFavicon('shortcut icon', ico);
  }, []);

  return null;
}



