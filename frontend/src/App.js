import '@/App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/lib/auth';
import { BrandProvider } from '@/lib/brand';
import { ProtectedRoute } from '@/lib/ProtectedRoute';

import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import About from '@/pages/About';
import Terms from '@/pages/Terms';
import Privacy from '@/pages/Privacy';
import Dashboard from '@/pages/Dashboard';
import SearchPage from '@/pages/Search';
import History from '@/pages/History';
import SearchDetail from '@/pages/SearchDetail';
import Billing from '@/pages/Billing';
import Support from '@/pages/Support';
import SupportDetail from '@/pages/SupportDetail';
import NotFound from '@/pages/NotFound';

import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminTenants from '@/pages/admin/AdminTenants';
import AdminSettings from '@/pages/admin/AdminSettings';
import AdminPlans from '@/pages/admin/AdminPlans';
import AdminTransactions from '@/pages/admin/AdminTransactions';
import AdminAudit from '@/pages/admin/AdminAudit';
import AdminTickets from '@/pages/admin/AdminTickets';

function App() {
  return (
    <BrandProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/about" element={<About />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />

            {/* Tenant */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
            <Route path="/search/:id" element={<ProtectedRoute><SearchDetail /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
            <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />

            {/* Shared: ticket detail for tenant + admin */}
            <Route path="/support/:id" element={<SupportDetail />} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/tenants" element={<ProtectedRoute adminOnly><AdminTenants /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute adminOnly><AdminSettings /></ProtectedRoute>} />
            <Route path="/admin/plans" element={<ProtectedRoute adminOnly><AdminPlans /></ProtectedRoute>} />
            <Route path="/admin/tickets" element={<ProtectedRoute adminOnly><AdminTickets /></ProtectedRoute>} />
            <Route path="/admin/transactions" element={<ProtectedRoute adminOnly><AdminTransactions /></ProtectedRoute>} />
            <Route path="/admin/audit" element={<ProtectedRoute adminOnly><AdminAudit /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </BrandProvider>
  );
}

export default App;
