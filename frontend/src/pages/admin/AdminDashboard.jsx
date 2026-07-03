import { useEffect, useState } from 'react';
import { DashboardShell } from '../../components/DashboardShell';
import { Card, CardContent } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { Badge } from '../../components/ui/badge';
import { api, money, fmtNum } from '../../lib/api';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import { Users, LineChart as LineIcon, IndianRupee, Coins, Zap, Database } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [chart, setChart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/admin/stats'), api.get('/admin/chart/searches?days=14')])
      .then(([s, c]) => { setStats(s.data); setChart(c.data.data || []); })
      .finally(() => setLoading(false));
  }, []);

  const kpis = [
    { label: 'Tenants',       value: fmtNum(stats?.tenants_count),   icon: Users,      testid: 'akpi-tenants' },
    { label: 'Active',        value: fmtNum(stats?.active_tenants),  icon: Users,      testid: 'akpi-active' },
    { label: 'Total searches',value: fmtNum(stats?.total_searches),  icon: LineIcon,   testid: 'akpi-searches' },
    { label: 'Results',       value: fmtNum(stats?.total_results),   icon: Database,   testid: 'akpi-results' },
    { label: 'Revenue',       value: money(stats?.revenue_inr),      icon: IndianRupee,testid: 'akpi-revenue' },
    { label: 'Credits sold',  value: fmtNum(stats?.credits_sold),    icon: Coins,      testid: 'akpi-sold' },
    { label: 'Credits used',  value: fmtNum(stats?.credits_used),    icon: Zap,        testid: 'akpi-used' },
  ];

  return (
    <DashboardShell admin>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">Platform overview</h1>
          <p className="text-muted-foreground mt-1">Live metrics across all tenants.</p>
        </div>
        <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">Super Admin</Badge>
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {kpis.map((k) => (
          <Card key={k.label} className="card-elev" data-testid={k.testid}>
            <CardContent className="p-4">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase tracking-wider"><k.icon className="h-3 w-3" />{k.label}</div>
              <div className="mt-1 font-mono tabular-nums text-xl font-semibold">{loading ? <Skeleton className="h-6 w-16" /> : k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-4">
        <Card className="card-elev">
          <CardContent className="p-5">
            <div className="flex items-center justify-between"><h3 className="font-display font-semibold">Searches — last 14 days</h3></div>
            <div className="h-64 mt-3">
              {loading ? <Skeleton className="h-full w-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="day" fontSize={11} stroke="#94a3b8" />
                    <YAxis fontSize={11} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                    <Line type="monotone" dataKey="searches" stroke="#F59E0B" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="card-elev">
          <CardContent className="p-5">
            <div className="flex items-center justify-between"><h3 className="font-display font-semibold">Results scraped — last 14 days</h3></div>
            <div className="h-64 mt-3">
              {loading ? <Skeleton className="h-full w-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="day" fontSize={11} stroke="#94a3b8" />
                    <YAxis fontSize={11} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="results" fill="#0EA5A4" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
