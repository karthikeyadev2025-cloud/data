import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardShell } from '../../components/DashboardShell';
import { Card, CardContent } from '../../components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import { api, fmtDate } from '../../lib/api';

const statusColor = (s) => s === 'open' ? 'bg-amber-100 text-amber-900' : s === 'in_progress' ? 'bg-blue-100 text-blue-900' : s === 'resolved' ? 'bg-teal-100 text-teal-900' : 'bg-slate-100 text-slate-700';

export default function AdminTickets() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const r = await api.get('/admin/tickets' + (status !== 'all' ? `?status=${status}` : ''));
    setItems(r.data.tickets); setLoading(false);
  };
  useEffect(() => { load(); }, [status]);

  return (
    <DashboardShell admin>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">Support tickets</h1>
          <p className="text-muted-foreground mt-1">Respond to client issues raised across all tenants.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40" data-testid="admin-ticket-status-filter"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="mt-6 card-elev">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Opened</TableHead><TableHead>Tenant</TableHead><TableHead>Subject</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {loading ? Array.from({length:3}).map((_,i)=>(<TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell></TableRow>)) :
                items.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No tickets</TableCell></TableRow> :
                items.map((t) => (
                  <TableRow key={t.id} data-testid={`atx-ticket-${t.id}`}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{fmtDate(t.created_at)}</TableCell>
                    <TableCell className="text-sm">{t.tenant_name || t.tenant_id.slice(0,8)}</TableCell>
                    <TableCell className="font-medium max-w-[280px] truncate">{t.subject}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] font-mono uppercase">{t.priority}</Badge></TableCell>
                    <TableCell><Badge className={statusColor(t.status)}>{t.status.replace('_', ' ')}</Badge></TableCell>
                    <TableCell className="text-right"><Button asChild size="sm" variant="outline" data-testid={`admin-open-ticket-${t.id}`}><Link to={`/support/${t.id}`}>Open</Link></Button></TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
