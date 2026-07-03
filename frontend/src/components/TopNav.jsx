import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { useAuth } from '../lib/auth';
import { Button } from './ui/button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export function TopNav({ variant = 'marketing' }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();

  const links = variant === 'marketing'
    ? [
        { label: 'Scrapers', href: '/#scrapers' },
        { label: 'Pricing', href: '/#pricing' },
        { label: 'How it works', href: '/#how' },
      ]
    : [];

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-border" data-testid="top-nav">
      <div className="container-wide h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {links.map((l) => (
              <a key={l.label} href={l.href} className="text-muted-foreground hover:text-foreground transition-colors">{l.label}</a>
            ))}
          </nav>
        </div>
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm" data-testid="nav-dashboard-btn">
                <Link to={user.role === 'super_admin' ? '/admin' : '/dashboard'}>Dashboard</Link>
              </Button>
              <Button size="sm" onClick={logout} variant="outline" data-testid="nav-logout-btn">Sign out</Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" data-testid="nav-signin-btn">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm" data-testid="nav-signup-btn" className="transition-btn lift-1">
                <Link to="/login?mode=signup">Get started free</Link>
              </Button>
            </>
          )}
        </div>
        <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="toggle menu" data-testid="nav-mobile-toggle">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-white">
          <div className="container-wide py-4 flex flex-col gap-3">
            {links.map((l) => (
              <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="text-sm text-muted-foreground py-1">{l.label}</a>
            ))}
            {user ? (
              <>
                <Button asChild size="sm"><Link to={user.role === 'super_admin' ? '/admin' : '/dashboard'} onClick={() => setOpen(false)}>Dashboard</Link></Button>
                <Button size="sm" variant="outline" onClick={() => { setOpen(false); logout(); }}>Sign out</Button>
              </>
            ) : (
              <>
                <Button asChild size="sm" variant="outline"><Link to="/login" onClick={() => setOpen(false)}>Sign in</Link></Button>
                <Button asChild size="sm"><Link to="/login?mode=signup" onClick={() => setOpen(false)}>Get started</Link></Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
