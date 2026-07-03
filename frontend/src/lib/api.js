import axios from 'axios';

export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API, timeout: 120000 });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('ntl_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      localStorage.removeItem('ntl_token');
      localStorage.removeItem('ntl_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const money = (n) => {
  if (n === null || n === undefined) return '₹0';
  return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
};
export const fmtNum = (n) => (n == null ? '0' : Number(n).toLocaleString('en-IN'));

export const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const SCRAPER_META = {
  google_maps:   { label: 'Google Maps',   icon: 'MapPin',       needsLocation: true,  placeholder: 'e.g. bangle shops', locPlaceholder: 'Hyderabad, India' },
  google_search: { label: 'Google Search', icon: 'Search',       needsLocation: false, placeholder: 'e.g. best CRM for real estate India' },
  youtube:       { label: 'YouTube',       icon: 'Youtube',      needsLocation: false, placeholder: 'e.g. south indian recipes' },
  instagram:     { label: 'Instagram',     icon: 'Instagram',    needsLocation: false, placeholder: 'e.g. jewellery hyderabad' },
  facebook:      { label: 'Facebook',      icon: 'Facebook',     needsLocation: false, placeholder: 'e.g. restaurants chennai' },
  website:       { label: 'Website',       icon: 'Globe',        needsLocation: false, placeholder: 'https://example.com' },
  ecommerce:     { label: 'E-commerce',    icon: 'ShoppingBag',  needsLocation: false, placeholder: 'https://shop.example.com/product' },
};
