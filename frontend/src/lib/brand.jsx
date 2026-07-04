import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

const BrandCtx = createContext({
  brand_name: 'INeedLeads',
  footer_text: 'An innovation by NIKKI TECH LABS',
  tagline: 'Real business contacts. One dashboard. Six scrapers.',
  primary_color_hex: '#0EA5A4',
});

function hexToHsl(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let hh = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hh = (g - b) / d + (g < b ? 6 : 0); break;
      case g: hh = (b - r) / d + 2; break;
      case b: hh = (r - g) / d + 4; break;
      default: hh = 0;
    }
    hh /= 6;
  }
  return `${Math.round(hh * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function BrandProvider({ children }) {
  const [brand, setBrand] = useState({
    brand_name: 'INeedLeads',
    footer_text: 'An innovation by NIKKI TECH LABS',
    tagline: 'Real business contacts. One dashboard. Six scrapers.',
    primary_color_hex: '#0EA5A4',
  });

  useEffect(() => {
    api.get('/branding').then((r) => {
      const b = r.data || {};
      const merged = {
        brand_name: b.brand_name || 'INeedLeads',
        footer_text: b.footer_text || 'An innovation by NIKKI TECH LABS',
        tagline: b.tagline || 'Real business contacts. One dashboard. Six scrapers.',
        primary_color_hex: b.primary_color_hex || '#0EA5A4',
      };
      setBrand(merged);
      // apply primary color to CSS var + document title
      const hsl = hexToHsl(merged.primary_color_hex);
      const root = document.documentElement;
      root.style.setProperty('--primary', hsl);
      root.style.setProperty('--ring', hsl);
      document.title = `${merged.brand_name} — ${merged.tagline}`;
    }).catch(() => {});
  }, []);

  return <BrandCtx.Provider value={brand}>{children}</BrandCtx.Provider>;
}

export const useBrand = () => useContext(BrandCtx);
