import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardShell } from '../components/DashboardShell';
import { ResultsTable } from '../components/ResultsTable';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { api, API, fmtDate } from '../lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Download, Trash2 } from 'lucide-react';

export default function ListDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get(`/lists/${id}`)
      .then((r) => setData(r.data))
      .catch(() => toast.error('Failed to load list'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const download = (fmt) => {
    const token = localStorage.getItem('ntl_token');
    fetch(`${API}/lists/${id}/export?format=${fmt}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `ineedleads-list-${id.slice(0, 8)}.${fmt}`;
        a.click();
      });
  };

  const removeItems = (itemIds) => {
    api.delete(`/lists/${id}/items`, { data: { item_ids: itemIds } })
      .then(() => { toast.success('Removed'); load(); })
      .catch(() => toast.error('Remove failed'));
  };

  const lst = data?.list;
  // Flatten joined results for the ResultsTable
  const rows = (data?.items || []).map((item) => ({
    ...item.search_results,
    _item_id: item.id,
    _notes: item.notes,
  }));

  return (
    <DashboardShell>
      <Button asChild variant="ghost" size="sm" className="mb-4" data-testid="back-to-lists">
        <Link to="/lists"><ArrowLeft className="h-4 w-4 mr-1" /> Back to lists</Link>
      </Button>

      {loading ? (
        <Skeleton className="h-24 w-full" />
      ) : lst ? (
        <Card className="card-elev overflow-hidden">
          <div className="h-1.5" style={{ backgroundColor: lst.color || '#0EA5A4' }} />
          <CardContent className="p-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight">{lst.name}</h1>
              {lst.description && <p className="text-sm text-muted-foreground mt-1">{lst.description}</p>}
              <div className="text-sm text-muted-foreground mt-1">
                {lst.count || rows.length} contacts · Created {fmtDate(lst.created_at)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => download('csv')} data-testid="list-export-csv">
                <Download className="h-4 w-4 mr-1.5" /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => download('xlsx')} data-testid="list-export-xlsx">
                <Download className="h-4 w-4 mr-1.5" /> XLSX
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-6">
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
            No contacts saved yet. Run a search and save contacts to this list.
          </div>
        ) : (
          <ResultsTable
            rows={rows}
            showRemove
            onRemove={(row) => removeItems([row._item_id])}
          />
        )}
      </div>
    </DashboardShell>
  );
}
