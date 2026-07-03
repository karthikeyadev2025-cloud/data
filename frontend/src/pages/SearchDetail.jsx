import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { DashboardShell } from '../components/DashboardShell';
import { ResultsTable } from '../components/ResultsTable';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { api, API, fmtDate } from '../lib/api';
import { Download, ArrowLeft } from 'lucide-react';

export default function SearchDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/search/${id}`).then((r) => setData(r.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, [id]);

  const download = (fmt) => {
    const token = localStorage.getItem('ntl_token');
    fetch(`${API}/search/${id}/export?format=${fmt}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `nikki-scraper-${id.slice(0,8)}.${fmt}`;
        a.click();
      });
  };

  const job = data?.job;

  return (
    <DashboardShell>
      <Button asChild variant="ghost" size="sm" className="mb-4" data-testid="back-to-history"><Link to="/history"><ArrowLeft className="h-4 w-4 mr-1" /> Back to history</Link></Button>

      {loading ? (
        <Skeleton className="h-24 w-full" />
      ) : job ? (
        <Card className="card-elev">
          <CardContent className="p-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-[10px]">{job.scraper_type}</Badge>
                <Badge variant={job.status === 'completed' ? 'default' : 'destructive'} className={job.status === 'completed' ? 'bg-teal-100 text-teal-900 hover:bg-teal-100' : ''}>{job.status}</Badge>
              </div>
              <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight mt-2">{job.query}</h1>
              <div className="text-sm text-muted-foreground mt-1">{job.location || '—'} · {fmtDate(job.created_at)} · {job.results_count} results · {job.credits_used} credits</div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => download('csv')} data-testid="detail-export-csv"><Download className="h-4 w-4 mr-1.5" /> CSV</Button>
              <Button variant="outline" size="sm" onClick={() => download('xlsx')} data-testid="detail-export-xlsx"><Download className="h-4 w-4 mr-1.5" /> XLSX</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-6">
        {loading ? <Skeleton className="h-40 w-full" /> : <ResultsTable rows={data?.results || []} />}
      </div>
    </DashboardShell>
  );
}
