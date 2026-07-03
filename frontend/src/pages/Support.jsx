import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DashboardShell } from '../components/DashboardShell';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { api, fmtDate } from '../lib/api';
import { Plus, LifeBuoy } from 'lucide-react';

const statusColor = (s) => s === 'open' ? 'bg-amber-100 text-amber-900' : s === 'in_progress' ? 'bg-blue-100 text-blue-900' : s === 'resolved' ? 'bg-teal-100 text-teal-900' : 'bg-slate-100 text-slate-700';

export default function Support() {
  const nav = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => { setLoading(true); const r = await api.get('/support/tickets'); setTickets(r.data.tickets); setLoading(false); };
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api.post('/support/tickets', {
        subject: e.target.subject.value,
        message: e.target.message.value,
        priority: e.target.priority.value,
      });
      toast.success('Ticket opened. Our team will respond shortly.');
      setOpen(false); load();
      nav(`/support/${r.data.ticket.id}`);
    } catch (err) { toast.error(err?.response?.data?.detail || 'Failed'); }
    finally { setBusy(false); }
  };

  return (
    <DashboardShell>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">Support</h1>
          <p className="text-muted-foreground mt-1">Raise a ticket and our team will get back to you.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="transition-btn lift-1" data-testid="support-new-btn"><Plus className="h-4 w-4 mr-1" /> New ticket</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Open a new ticket</DialogTitle></DialogHeader>
            <form onSubmit={create} className="space-y-3">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" name="subject" required minLength={3} placeholder="Short summary" data-testid="ticket-subject-input" />
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select name="priority" defaultValue="normal">
                  <SelectTrigger id="priority" data-testid="ticket-priority-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="message">Describe the issue</Label>
                <textarea id="message" name="message" required minLength={5} rows={5} className="w-full border border-input rounded-md p-2 text-sm" placeholder="Details, steps, expected vs actual..." data-testid="ticket-message-input" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={busy} data-testid="ticket-submit-btn">{busy ? 'Submitting…' : 'Submit ticket'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mt-6 card-elev">
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>When</TableHead><TableHead>Subject</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {loading ? Array.from({length:3}).map((_,i)=>(<TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>)) :
                tickets.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <LifeBuoy className="h-6 w-6 mx-auto mb-2 opacity-60" />
                    No tickets yet. Click “New ticket” to open your first one.
                  </TableCell></TableRow>
                ) : tickets.map((t) => (
                  <TableRow key={t.id} data-testid={`ticket-row-${t.id}`} className="hover:bg-muted/40">
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{fmtDate(t.created_at)}</TableCell>
                    <TableCell className="font-medium max-w-[300px] truncate" title={t.subject}>{t.subject}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] font-mono uppercase">{t.priority}</Badge></TableCell>
                    <TableCell><Badge className={`${statusColor(t.status)} hover:opacity-90`}>{t.status.replace('_', ' ')}</Badge></TableCell>
                    <TableCell className="text-right"><Button asChild size="sm" variant="outline"><Link to={`/support/${t.id}`}>Open</Link></Button></TableCell>
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
