import { Navigate } from 'react-router-dom';
import { useAuth } from './auth';

export function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'super_admin') return <Navigate to="/dashboard" replace />;
  if (!adminOnly && user.role === 'super_admin') return <Navigate to="/admin" replace />;
  return children;
}
