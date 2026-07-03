import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { DashboardShell } from '../components/DashboardShell';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { api, fmtDate } from '../lib/api';
import { ArrowLeft, Send, LifeBuoy } from 'lucide-react';
import { useAuth } from '../lib/auth';

const statusColor = (s) => s === 'open' ? 'bg-amber-100 text-amber-900' : s === 'in_progress' ? 'bg-blue-100 text-blue-900' : s === 'resolved' ? 'bg-teal-100 text-teal-900' : 'bg-slate-100 text-slate-700';

export default function SupportDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === 'super_admin';
  const [data, setData] = useState(null);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const r = await api.get(`/support/tickets/${id}`); setData(r.data); }
    catch (e) { toast.error(e?.response?.data?.detail || 'Failed'); }
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  const send = async () => {
    if (!reply.trim()) return;
    setBusy(true);
    try {
      await api.post(`/support/tickets/${id}/reply`, { message: reply });
      setReply(''); load();
    } catch (e) { toast.error(e?.response?.data?.detail || 'Failed'); }
    finally { setBusy(false); }
  };

  const setStatus = async (status) => {
    try { await api.patch(`/admin/tickets/${id}`, { status }); toast.success('Updated'); load(); }
    catch (e) { toast.error(e?.response?.data?.detail || 'Failed'); }
  };

  return (
    <DashboardShell admin={isAdmin}>
      <Button asChild variant="ghost" size="sm" className="mb-3" data-testid="back-to-support">
        <Link to={isAdmin ? '/admin/tickets' : '/support'}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
      </Button>

      {loading ? <Skeleton className="h-40 w-full" /> : data && (
        <>
          <Card className="card-elev">
            <CardContent className="p-6">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <LifeBuoy className="h-4 w-4 text-primary" />
                    <Badge className={statusColor(data.ticket.status)}>{data.ticket.status.replace('_', ' ')}</Badge>
                    <Badge variant="outline" className="text-[10px] font-mono uppercase">{data.ticket.priority}</Badge>
                  </div>
                  <h1 className="font-display text-xl sm:text-2xl font-semibold mt-2">{data.ticket.subject}</h1>
                  <div className="text-sm text-muted-foreground mt-1">Opened {fmtDate(data.ticket.created_at)}</div>
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setStatus('in_progress')} data-testid="admin-set-inprogress">In progress</Button>
                    <Button size="sm" variant="outline" onClick={() => setStatus('resolved')} data-testid="admin-set-resolved">Resolve</Button>
                    <Button size="sm" variant="outline" onClick={() => setStatus('closed')} data-testid="admin-set-closed">Close</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 space-y-3">
            {data.messages.map((m) => (
              <div key={m.id} className={`flex ${m.author_role === 'super_admin' ? 'justify-start' : 'justify-end'}`}>
                <Card className={`max-w-2xl card-elev ${m.author_role === 'super_admin' ? 'bg-primary/5 border-primary/20' : ''}`}>
                  <CardContent className="p-4">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                      {m.author_role === 'super_admin' ? 'Support Team' : 'You'} · {fmtDate(m.created_at)}
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{m.message}</div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {(data.ticket.status !== 'closed') && (
            <Card className="mt-6 card-elev">
              <CardContent className="p-4">
                <div className="flex items-end gap-2">
                  <textarea rows={2} value={reply} onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your reply…"
                    className="flex-1 min-w-0 border border-input rounded-md p-2 text-sm"
                    data-testid="ticket-reply-input" />
                  <Button onClick={send} disabled={busy || !reply.trim()} data-testid="ticket-reply-send"><Send className="h-4 w-4 mr-1" /> Send</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </DashboardShell>
  );
}
