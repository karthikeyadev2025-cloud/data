import { useEffect, useState } from 'react';
import { DashboardShell } from '../../components/DashboardShell';
import { Card, CardContent } from '../../components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { api, fmtDate } from '../../lib/api';

export default function AdminAudit() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/admin/audit').then(r => setItems(r.data.logs)).finally(() => setLoading(false)); }, []);

  return (
    <DashboardShell admin>
      <div><h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">Audit log</h1></div>
      <Card className="mt-6 card-elev"><CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>When</TableHead><TableHead>Actor</TableHead><TableHead>Action</TableHead>
            <TableHead>Target</TableHead><TableHead>Details</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? Array.from({length:5}).map((_,i)=>(<TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-6 w-full" /></TableCell></TableRow>)) :
              items.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No log entries</TableCell></TableRow> :
              items.map((l) => (
                <TableRow key={l.id} data-testid={`audit-${l.id}`}>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{fmtDate(l.created_at)}</TableCell>
                  <TableCell className="text-sm">{l.actor_email}</TableCell>
                  <TableCell><Badge variant="outline" className="font-mono text-[10px]">{l.action}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{l.target_type} {(l.target_id || '').slice(0,8)}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground max-w-[260px] truncate">{l.details ? JSON.stringify(l.details) : '—'}</TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </Table>
      </CardContent></Card>
    </DashboardShell>
  );
}
