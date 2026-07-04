import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Logo } from '../components/Logo';
import { ShieldCheck, Sparkles, MapPin, Search, Zap } from 'lucide-react';

export default function Login() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { user, login, signup } = useAuth();
  const [tab, setTab] = useState(params.get('mode') === 'signup' ? 'signup' : 'login');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) nav(user.role === 'super_admin' ? '/admin' : '/dashboard', { replace: true });
  }, [user, nav]);

  const onLogin = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const email = e.target.email.value.trim();
      const password = e.target.password.value;
      const data = await login(email, password);
      toast.success(`Welcome back, ${data.user.full_name || data.user.email}`);
      nav(data.user.role === 'super_admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Login failed');
    } finally { setBusy(false); }
  };

  const onSignup = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        email: e.target.email.value.trim(),
        password: e.target.password.value,
        full_name: e.target.full_name.value.trim(),
        company: e.target.company.value.trim() || null,
      };
      await signup(payload);
      toast.success('Account created. Welcome!');
      nav('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Signup failed');
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — brand & trust */}
      <div className="hidden lg:flex bg-hero-mist bg-noise relative flex-col justify-between p-10">
        <Logo size="lg" />
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }} className="max-w-md">
          <h2 className="font-display text-3xl font-semibold tracking-tight leading-tight">The fastest way to reach<br /><span className="text-primary">real businesses.</span></h2>
          <p className="mt-3 text-muted-foreground">Six scrapers, one dashboard. Trusted by agencies and SMBs in Hyderabad, Chennai, Bangalore & Kochi.</p>
          <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
            {[
              { icon: MapPin,     t: 'Google Maps' },
              { icon: Search,     t: 'Search Results' },
              { icon: Zap,        t: 'Fast Exports' },
              { icon: ShieldCheck,t: 'GST Invoices' },
            ].map((x) => (
              <div key={x.t} className="p-3 rounded-lg bg-white/60 border border-border flex items-center gap-2">
                <x.icon className="h-4 w-4 text-primary" /> {x.t}
              </div>
            ))}
          </div>
        </motion.div>
        <div className="text-xs text-muted-foreground">An innovation by NIKKI TECH LABS</div>
      </div>

      {/* Right — auth card */}
      <div className="flex items-center justify-center p-6 sm:p-10 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8"><Logo size="lg" /></div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">{tab === 'signup' ? 'Create your account' : 'Sign in'}</h1>
          <p className="text-muted-foreground mt-1">Access your INeedLeads dashboard.</p>

          <Tabs value={tab} onValueChange={setTab} className="mt-6">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login" data-testid="tab-login">Sign in</TabsTrigger>
              <TabsTrigger value="signup" data-testid="tab-signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <form onSubmit={onLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required autoComplete="email" data-testid="login-email-input" placeholder="you@company.com" />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" required autoComplete="current-password" data-testid="login-password-input" placeholder="••••••••" />
                </div>
                <Button type="submit" className="w-full transition-btn" disabled={busy} data-testid="login-submit">
                  {busy ? 'Signing in…' : 'Sign in'}
                </Button>
                <p className="text-xs text-muted-foreground text-center">Super admins use their assigned password.</p>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={onSignup} className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Full name</Label>
                  <Input id="full_name" name="full_name" required data-testid="signup-name-input" placeholder="Karthi Kumar" />
                </div>
                <div>
                  <Label htmlFor="company">Company (optional)</Label>
                  <Input id="company" name="company" data-testid="signup-company-input" placeholder="e.g. INeedLeads" />
                </div>
                <div>
                  <Label htmlFor="email2">Email</Label>
                  <Input id="email2" name="email" type="email" required autoComplete="email" data-testid="signup-email-input" placeholder="you@company.com" />
                </div>
                <div>
                  <Label htmlFor="password2">Password</Label>
                  <Input id="password2" name="password" type="password" minLength={6} required autoComplete="new-password" data-testid="signup-password-input" placeholder="At least 6 characters" />
                </div>
                <Button type="submit" className="w-full transition-btn" disabled={busy} data-testid="signup-submit">
                  {busy ? 'Creating…' : 'Create account & start free'}
                </Button>
                <p className="text-xs text-muted-foreground text-center">Get 25 free credits on signup.</p>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-8 text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">← Back to home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
