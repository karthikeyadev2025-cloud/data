import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useBrand } from '../lib/brand';
import { Logo } from './Logo';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { LayoutDashboard, Search, History, CreditCard, Settings, Users, LineChart, ClipboardList, LogOut, Menu, Package, Coins, LifeBuoy, MessageSquare } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { useState } from 'react';
import { fmtNum } from '../lib/api';

const tenantNav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, testid: 'nav-dashboard' },
  { to: '/search',    label: 'New Search', icon: Search,          testid: 'nav-search' },
  { to: '/history',   label: 'History',    icon: History,         testid: 'nav-history' },
  { to: '/lists',     label: 'My Lists',   icon: ClipboardList,   testid: 'nav-lists' },
  { to: '/billing',   label: 'Billing',    icon: CreditCard,      testid: 'nav-billing' },
  { to: '/support',   label: 'Support',    icon: LifeBuoy,        testid: 'nav-support' },
];

const adminNav = [
  { to: '/admin',              label: 'Overview',     icon: LineChart,     testid: 'anav-overview' },
  { to: '/admin/tenants',      label: 'Tenants',       icon: Users,         testid: 'anav-tenants' },
  { to: '/admin/plans',        label: 'Plans',         icon: Package,       testid: 'anav-plans' },
  { to: '/admin/settings',     label: 'Settings',      icon: Settings,      testid: 'anav-settings' },
  { to: '/admin/tickets',      label: 'Support',       icon: MessageSquare, testid: 'anav-tickets' },
  { to: '/admin/transactions', label: 'Transactions',  icon: Coins,         testid: 'anav-tx' },
  { to: '/admin/audit',        label: 'Audit Log',     icon: ClipboardList, testid: 'anav-audit' },
];

function NavList({ items, onNavigate }) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map((it) => (
        <NavLink key={it.to} to={it.to} end={it.to === '/admin' || it.to === '/dashboard'} onClick={onNavigate} data-testid={it.testid}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`
          }>
          <it.icon className="h-4 w-4" /> {it.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function DashboardShell({ children, admin = false }) {
  const { user, tenant, logout } = useAuth();
  const { brand_name } = useBrand();
  const [open, setOpen] = useState(false);
  const items = admin ? adminNav : tenantNav;
  const scopeClass = admin ? 'admin-scope' : '';

  return (
    <div className={`min-h-screen bg-background ${scopeClass}`}>
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-border">
        <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden" data-testid="shell-menu-btn"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <div className="mb-6"><Logo brand={brand_name} linkTo={admin ? '/admin' : '/dashboard'} /></div>
                {admin && <Badge variant="secondary" className="mb-4 bg-amber-100 text-amber-900">Super Admin</Badge>}
                <NavList items={items} onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <Logo brand={brand_name} linkTo={admin ? '/admin' : '/dashboard'} />
            {admin && <Badge variant="secondary" className="bg-amber-100 text-amber-900 hidden sm:inline-flex" data-testid="admin-badge">Super Admin</Badge>}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {tenant && !admin && (
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5" data-testid="credits-badge">
                <Coins className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono tabular-nums text-sm">{fmtNum(tenant.credits_balance)}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">credits</span>
              </div>
            )}
            {!admin && (
              <Button asChild size="sm" className="hidden sm:inline-flex transition-btn lift-1" data-testid="topbar-buy-credits"><Link to="/billing">Buy credits</Link></Button>
            )}
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <div className="hidden sm:block text-right leading-tight">
                <div className="text-sm font-medium">{user?.full_name || user?.email}</div>
                <div className="text-xs text-muted-foreground">{admin ? 'super admin' : (tenant?.name || 'tenant')}</div>
              </div>
              <Button variant="ghost" size="icon" onClick={logout} data-testid="shell-logout-btn" aria-label="logout"><LogOut className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden lg:flex w-64 shrink-0 border-r border-border bg-white/40 min-h-[calc(100vh-4rem)] p-4 flex-col">
          <NavList items={items} />
          <div className="mt-auto text-xs text-muted-foreground pt-6">
            {admin ? 'Managing platform' : (tenant?.plan_code ? `Plan: ${tenant.plan_code}` : '')}
          </div>
        </aside>

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
