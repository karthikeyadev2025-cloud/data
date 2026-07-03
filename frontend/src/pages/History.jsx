import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardShell } from '../components/DashboardShell';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import { api, fmtDate } from '../lib/api';
import { Search } from 'lucide-react';

export default function History() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/search').then((r) => setItems(r.data.searches)).finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">Search history</h1>
          <p className="text-muted-foreground mt-1">All your past searches. Click any row to re-view results.</p>
        </div>
        <Button asChild data-testid="history-new-btn"><Link to="/search"><Search className="h-4 w-4 mr-1.5" /> New search</Link></Button>
      </div>

      <Card className="mt-6 card-elev">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Scraper</TableHead>
                <TableHead>Query</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Results</TableHead>
                <TableHead className="text-right">Credits</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-14 text-muted-foreground">No searches yet.</TableCell></TableRow>
              ) : items.map((s) => (
                <TableRow key={s.id} data-testid={`history-row-${s.id}`} className="hover:bg-muted/40">
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{fmtDate(s.created_at)}</TableCell>
                  <TableCell><Badge variant="outline" className="font-mono text-[10px]">{s.scraper_type}</Badge></TableCell>
                  <TableCell className="font-medium max-w-[240px] truncate" title={s.query}>{s.query}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.location || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === 'completed' ? 'default' : s.status === 'failed' ? 'destructive' : 'secondary'}
                      className={s.status === 'completed' ? 'bg-teal-100 text-teal-900 hover:bg-teal-100' : ''}>{s.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{s.results_count}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{s.credits_used}</TableCell>
                  <TableCell className="text-right"><Button asChild size="sm" variant="outline" data-testid={`history-open-${s.id}`}><Link to={`/search/${s.id}`}>Open</Link></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
