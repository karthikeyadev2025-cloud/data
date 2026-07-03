import { useEffect, useState } from 'react';
import { DashboardShell } from '../../components/DashboardShell';
import { Card, CardContent } from '../../components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { api, money, fmtDate } from '../../lib/api';

export default function AdminTransactions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/admin/transactions').then(r => setItems(r.data.transactions)).finally(() => setLoading(false)); }, []);

  return (
    <DashboardShell admin>
      <div><h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">Transactions</h1></div>
      <Card className="mt-6 card-elev"><CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Date</TableHead><TableHead>Tenant</TableHead><TableHead>Type</TableHead>
            <TableHead className="text-right">Credits</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead><TableHead>Notes</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? Array.from({length:5}).map((_,i)=>(<TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-6 w-full" /></TableCell></TableRow>)) :
              items.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No transactions</TableCell></TableRow> :
              items.map((t) => (
                <TableRow key={t.id} data-testid={`atx-${t.id}`}>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{fmtDate(t.created_at)}</TableCell>
                  <TableCell className="font-mono text-xs">{(t.tenant_id || '').slice(0,8)}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px] font-mono">{t.type}</Badge></TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{t.credits_delta > 0 ? '+' : ''}{t.credits_delta}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{money(t.amount_inr)}</TableCell>
                  <TableCell><Badge variant={t.status === 'success' ? 'default' : t.status === 'failed' ? 'destructive' : 'secondary'} className={t.status === 'success' ? 'bg-teal-100 text-teal-900 hover:bg-teal-100' : ''}>{t.status}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[240px] truncate" title={t.notes}>{t.notes || '—'}</TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </Table>
      </CardContent></Card>
    </DashboardShell>
  );
}
