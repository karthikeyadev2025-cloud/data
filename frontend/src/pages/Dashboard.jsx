import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DashboardShell } from '../components/DashboardShell';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { api, fmtNum, fmtDate } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Search, ArrowRight, Sparkles, TrendingUp, Coins, Users } from 'lucide-react';

export default function Dashboard() {
  const { tenant, refreshTenant } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats').then((r) => setStats(r.data)).finally(() => setLoading(false));
    refreshTenant();
  }, []);

  const kpis = [
    { label: 'Credits balance', value: fmtNum(tenant?.credits_balance ?? 0), icon: Coins, testid: 'kpi-credits' },
    { label: 'Total searches', value: fmtNum(stats?.total_searches ?? 0), icon: Search, testid: 'kpi-searches' },
    { label: 'Results scraped', value: fmtNum(stats?.total_results ?? 0), icon: Users, testid: 'kpi-results' },
    { label: 'Credits used', value: fmtNum(stats?.credits_used ?? 0), icon: TrendingUp, testid: 'kpi-used' },
  ];

  return (
    <DashboardShell>
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">Welcome back{tenant ? ', ' + tenant.name : ''} 👋</h1>
          <p className="text-muted-foreground mt-1">Pick a scraper and get real business contacts in seconds.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="uppercase tracking-wide">Plan: {tenant?.plan_code || 'free'}</Badge>
          <Button asChild className="transition-btn lift-1" data-testid="dashboard-new-search-btn"><Link to="/search"><Search className="h-4 w-4 mr-1.5" /> New search</Link></Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="card-elev" data-testid={k.testid}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider"><k.icon className="h-3.5 w-3.5" /> {k.label}</div>
                <div className="mt-2 font-mono tabular-nums text-2xl sm:text-3xl font-semibold">{loading ? <Skeleton className="h-8 w-20" /> : k.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mt-8 grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 card-elev">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-primary">Quick search</div>
                <h3 className="font-display text-xl font-semibold mt-1">Find businesses now</h3>
              </div>
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mt-1">Try “restaurants in Hyderabad” or “clinics near Chennai”.</p>
            <Button asChild className="mt-5" data-testid="quick-search-cta"><Link to="/search">Start a search <ArrowRight className="h-4 w-4 ml-1" /></Link></Button>
          </CardContent>
        </Card>
        <Card className="card-elev">
          <CardContent className="p-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">Running low?</div>
            <h3 className="font-display text-xl font-semibold mt-1">Buy credits</h3>
            <p className="text-sm text-muted-foreground mt-1">Top-up via Razorpay. 1 credit ≈ 1 result. GST invoice included.</p>
            <Button asChild variant="outline" className="mt-5" data-testid="dashboard-buy-credits-button"><Link to="/billing">Buy credits <Coins className="h-4 w-4 ml-1" /></Link></Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent searches */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Recent searches</h3>
          <Button asChild variant="ghost" size="sm" data-testid="view-all-searches"><Link to="/history">View all</Link></Button>
        </div>
        <div className="mt-3 rounded-xl border border-border overflow-hidden bg-white">
          {loading ? (
            <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (stats?.recent_searches?.length ? (
            <ul className="divide-y divide-border">
              {stats.recent_searches.map((s) => (
                <li key={s.id} className="px-4 py-3 flex items-center justify-between hover:bg-muted/40">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[10px]">{s.scraper_type}</Badge>
                      <div className="font-medium truncate">{s.query}</div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.location || '—'} · {fmtDate(s.created_at)}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground">{s.results_count} results</span>
                    <Button asChild size="sm" variant="outline" data-testid={`recent-open-${s.id}`}><Link to={`/search/${s.id}`}>Open</Link></Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-10 text-center text-sm text-muted-foreground">No searches yet. Try your first search now.</div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
