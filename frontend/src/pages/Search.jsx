import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DashboardShell } from '../components/DashboardShell';
import { ResultsTable } from '../components/ResultsTable';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Slider } from '../components/ui/slider';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { api, API, SCRAPER_META } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Download, Zap, Info, MapPin, Search, Youtube, Instagram, Facebook, Globe, ShoppingBag } from 'lucide-react';

const iconMap = { MapPin, Search, Youtube, Instagram, Facebook, Globe, ShoppingBag };

export default function SearchPage() {
  const { tenant, refreshTenant } = useAuth();
  const nav = useNavigate();
  const [scraperType, setScraperType] = useState('google_maps');
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [max, setMax] = useState(10);
  const [busy, setBusy] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [rows, setRows] = useState([]);

  const meta = SCRAPER_META[scraperType];

  const run = async () => {
    if (!query.trim()) return toast.error('Enter a keyword or URL');
    setBusy(true); setRows([]); setJobId(null);
    try {
      const r = await api.post('/search', {
        scraper_type: scraperType, query: query.trim(),
        location: meta.needsLocation ? (location.trim() || null) : null,
        max_results: max,
      });
      setJobId(r.data.job_id); setRows(r.data.results);
      toast.success(`Got ${r.data.results_count} results · ${r.data.credits_used} credits used`);
      refreshTenant();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Search failed');
    } finally { setBusy(false); }
  };

  const download = (fmt) => {
    if (!jobId) return;
    const token = localStorage.getItem('ntl_token');
    const url = `${API}/search/${jobId}/export?format=${fmt}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `nikki-scraper-${jobId.slice(0,8)}.${fmt}`;
        a.click();
      })
      .catch(() => toast.error('Export failed'));
  };

  return (
    <DashboardShell>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">New search</h1>
          <p className="text-muted-foreground mt-1">Pick a scraper, run a query, export results.</p>
        </div>
        <Badge variant="secondary" className="font-mono tabular-nums">Credits: {tenant?.credits_balance ?? 0}</Badge>
      </div>

      {/* Scraper type tabs */}
      <div className="mt-6">
        <Tabs value={scraperType} onValueChange={setScraperType}>
          <TabsList data-testid="scraper-type-tabs" className="flex flex-wrap h-auto w-full justify-start bg-muted/50 p-1">
            {Object.entries(SCRAPER_META).map(([key, m]) => {
              const Icon = iconMap[m.icon];
              return (
                <TabsTrigger key={key} value={key} data-testid={`scraper-tab-${key}`} className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm gap-1.5">
                  {Icon && <Icon className="h-3.5 w-3.5" />} {m.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Form card */}
      <Card className="mt-4 card-elev">
        <CardContent className="p-5 sm:p-6">
          <div className="grid md:grid-cols-12 gap-4">
            <div className={meta.needsLocation ? 'md:col-span-5' : 'md:col-span-8'}>
              <Label htmlFor="q">{scraperType === 'website' || scraperType === 'ecommerce' ? 'URL' : 'Keyword'}</Label>
              <Input id="q" data-testid="search-query-input" placeholder={meta.placeholder} value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            {meta.needsLocation && (
              <div className="md:col-span-3">
                <Label htmlFor="loc">Location</Label>
                <Input id="loc" data-testid="search-location-input" placeholder={meta.locPlaceholder} value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
            )}
            <div className="md:col-span-2">
              <Label>Results: <span className="font-mono tabular-nums">{max}</span></Label>
              <Slider min={1} max={60} step={1} value={[max]} onValueChange={(v) => setMax(v[0])} className="mt-3" data-testid="search-max-slider" />
            </div>
            <div className="md:col-span-2 flex items-end">
              <Button className="w-full transition-btn lift-1" onClick={run} disabled={busy} data-testid="search-run-btn">
                <Zap className="h-4 w-4 mr-1.5" /> {busy ? 'Running…' : 'Run search'}
              </Button>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <div>
              {scraperType === 'google_maps' && '1 credit per business returned. Auto-enriches websites for emails + social handles.'}
              {scraperType === 'youtube' && '1 credit per video. Fetches title, views, likes, channel.'}
              {scraperType === 'google_search' && 'Requires SerpAPI key (super admin adds in Settings).'}
              {scraperType === 'website' && 'Extract emails, phone, socials from any public URL.'}
              {scraperType === 'ecommerce' && 'Extract product name, price, brand from any product page.'}
              {(scraperType === 'instagram' || scraperType === 'facebook') && 'Requires Apify token (super admin adds in Settings).'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="mt-6 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">{busy ? 'Scraping…' : (rows.length ? `Results (${rows.length})` : 'Results')}</h3>
        {jobId && rows.length > 0 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => download('csv')} data-testid="search-export-csv-button"><Download className="h-4 w-4 mr-1.5" /> CSV</Button>
            <Button variant="outline" size="sm" onClick={() => download('xlsx')} data-testid="search-export-xlsx-button"><Download className="h-4 w-4 mr-1.5" /> XLSX</Button>
          </div>
        )}
      </div>
      <div className="mt-3">
        {busy ? (
          <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : (
          <ResultsTable rows={rows} empty="Run a search to see results here." />
        )}
      </div>
    </DashboardShell>
  );
}
