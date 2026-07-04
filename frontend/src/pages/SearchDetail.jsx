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
import { Download, ArrowLeft, ShieldCheck, Database } from 'lucide-react';

export default function SearchDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [exportingSheet, setExportingSheet] = useState(false);

  const loadData = () => {
    api.get(`/search/${id}`)
      .then((r) => setData(r.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const download = (fmt) => {
    const token = localStorage.getItem('ntl_token');
    fetch(`${API}/search/${id}/export?format=${fmt}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `ineedleads-scraper-${id.slice(0,8)}.${fmt}`;
        a.click();
      });
  };

  const handleExportGoogleSheet = () => {
    setExportingSheet(true);
    api.get(`/search/${id}/export?format=gsheet`)
      .then((r) => {
        if (r.data?.url) {
          window.open(r.data.url, '_blank');
          toast.success('Spreadsheet exported and opened successfully!');
        } else {
          toast.error('Failed to export to Google Sheets');
        }
      })
      .catch((err) => {
        const msg = err.response?.data?.detail || 'Failed to export to Google Sheets';
        toast.error(msg);
      })
      .finally(() => setExportingSheet(false));
  };

  const handleVerifyEmails = () => {
    setVerifying(true);
    api.post(`/search/${id}/verify-emails`)
      .then((r) => {
        toast.success(`Verification complete! Verified ${r.data.verified} emails.`);
        loadData();
      })
      .catch((err) => {
        const msg = err.response?.data?.detail || 'Verification failed';
        toast.error(msg);
      })
      .finally(() => setVerifying(false));
  };

  const job = data?.job;
  const emailsCount = (data?.results || []).filter(r => r.email).length;

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
            <div className="flex flex-wrap items-center gap-2">
              {emailsCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleVerifyEmails}
                  disabled={verifying}
                  className="border-primary/40 text-primary hover:bg-primary/5 hover:text-primary"
                  data-testid="detail-verify-emails"
                >
                  <ShieldCheck className="h-4 w-4 mr-1.5" />
                  {verifying ? 'Verifying...' : 'Verify Emails'}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportGoogleSheet}
                disabled={exportingSheet}
                className="border-green-600/40 text-green-600 hover:bg-green-50 hover:text-green-700"
                data-testid="detail-export-gsheet"
              >
                <Database className="h-4 w-4 mr-1.5" />
                {exportingSheet ? 'Exporting...' : 'Google Sheets'}
              </Button>
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

