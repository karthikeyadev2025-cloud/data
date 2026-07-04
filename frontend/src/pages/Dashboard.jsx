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
import { Search, ArrowRight, Sparkles, TrendingUp, Coins, Users, BarChart2, LineChart as ChartIcon } from 'lucide-react';

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

  // Render SVG Line Chart for 30-Day Searches
  const renderTrendLine = () => {
    const data = stats?.daily_searches || [];
    if (data.length === 0) return <div className="text-center text-xs text-muted-foreground py-10">No data available</div>;

    const maxVal = Math.max(...data.map(d => d.count), 5); // default height at least 5
    const width = 500;
    const height = 120;
    const padding = 15;

    // Map to SVG coordinates
    const points = data.map((d, index) => {
      const x = padding + (index * (width - padding * 2)) / (data.length - 1);
      const y = height - padding - (d.count * (height - padding * 2)) / maxVal;
      return { x, y };
    });

    const pathD = points.reduce((acc, p, index) => {
      return index === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    // Background gradient path definition
    const areaD = pathD ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z` : '';

    return (
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[120px] overflow-visible">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0EA5A4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0EA5A4" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Y Axis Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f1f5f9" strokeWidth="1" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#f1f5f9" strokeWidth="1" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1" />

          {/* Area under the line */}
          {areaD && <path d={areaD} fill="url(#chartGradient)" />}

          {/* Sparkline curve */}
          {pathD && <path d={pathD} fill="none" stroke="#0EA5A4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

          {/* Interactive dots for peak values */}
          {points.map((p, i) => {
            if (data[i].count === 0) return null;
            const isPeak = data[i].count === Math.max(...data.map(x => x.count));
            return isPeak ? (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="5" fill="#0EA5A4" stroke="#ffffff" strokeWidth="1.5" className="animate-pulse" />
                <text x={p.x} y={p.y - 8} textAnchor="middle" className="text-[9px] font-mono font-semibold fill-teal-700 bg-white px-1 rounded">{data[i].count}</text>
              </g>
            ) : null;
          })}
        </svg>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-2 font-mono">
          <span>{data[0]?.date ? fmtDate(data[0].date).split(',')[0] : '30d ago'}</span>
          <span>Today</span>
        </div>
      </div>
    );
  };

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

      {/* Analytics Section */}
      <div className="mt-8">
        <h3 className="font-display text-lg font-semibold mb-3">Analytics & Insights</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {/* Trend chart */}
          <Card className="md:col-span-2 card-elev">
            <CardContent className="p-5">
              <div className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-primary mb-3">
                <ChartIcon className="h-4 w-4" /> 30-Day Search Volume Trend
              </div>
              {loading ? <Skeleton className="h-32 w-full" /> : renderTrendLine()}
            </CardContent>
          </Card>

          {/* Scrapers and Cities stats */}
          <Card className="card-elev">
            <CardContent className="p-5 space-y-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary mb-2.5">
                  <BarChart2 className="h-4 w-4" /> Scraper Breakdown
                </div>
                {loading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (stats?.scraper_breakdown?.length ? (
                  <div className="space-y-1.5">
                    {stats.scraper_breakdown.slice(0, 3).map((s) => {
                      const total = stats.total_searches || 1;
                      const percent = Math.round((s.count / total) * 100);
                      return (
                        <div key={s.type} className="text-xs">
                          <div className="flex justify-between font-medium">
                            <span className="capitalize">{s.type.replace('_', ' ')}</span>
                            <span>{s.count} ({percent}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-0.5 overflow-hidden">
                            <div className="bg-primary h-full rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">No searches run yet</div>
                ))}
              </div>

              <div className="pt-2 border-t border-border">
                <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                  Top Target Regions
                </div>
                {loading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (stats?.top_cities?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {stats.top_cities.slice(0, 5).map((c) => (
                      <Badge key={c.city} variant="secondary" className="text-[10px] font-medium py-1">
                        {c.city} ({c.count})
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">No regional queries yet</div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
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
