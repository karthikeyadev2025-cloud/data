import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ntl_token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me').then((r) => {
      setUser(r.data.user); setTenant(r.data.tenant);
    }).catch(() => {
      localStorage.removeItem('ntl_token');
    }).finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const r = await api.post('/auth/login', { email, password });
    localStorage.setItem('ntl_token', r.data.token);
    setUser(r.data.user); setTenant(r.data.tenant);
    return r.data;
  };

  const signup = async (payload) => {
    const r = await api.post('/auth/signup', payload);
    localStorage.setItem('ntl_token', r.data.token);
    setUser(r.data.user); setTenant(r.data.tenant);
    return r.data;
  };

  const googleLogin = async (id_token) => {
    const r = await api.post('/auth/google', { id_token });
    localStorage.setItem('ntl_token', r.data.token);
    setUser(r.data.user); setTenant(r.data.tenant);
    return r.data;
  };

  const logout = () => {
    localStorage.removeItem('ntl_token');
    setUser(null); setTenant(null);
    window.location.href = '/';
  };

  const refreshTenant = async () => {
    const r = await api.get('/auth/me');
    setTenant(r.data.tenant);
    setUser(r.data.user);
  };

  const isAdmin = user?.role === 'super_admin';

  return (
    <AuthCtx.Provider value={{ user, tenant, loading, login, signup, googleLogin, logout, refreshTenant, isAdmin, setTenant }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
