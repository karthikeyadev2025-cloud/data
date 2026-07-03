import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DashboardShell } from '../components/DashboardShell';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { api, money, fmtDate } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Coins, Check, Sparkles } from 'lucide-react';

export default function Billing() {
  const { tenant, refreshTenant } = useAuth();
  const [plans, setPlans] = useState([]);
  const [txns, setTxns] = useState([]);
  const [cfg, setCfg] = useState({ enabled: false });
  const [loading, setLoading] = useState(true);
  const [buyOpen, setBuyOpen] = useState(false);
  const [credits, setCredits] = useState(500);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const [p, t, c] = await Promise.all([
      api.get('/plans'), api.get('/transactions'), api.get('/payments/config'),
    ]);
    setPlans(p.data.plans);
    setTxns(t.data.transactions);
    setCfg(c.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openRazorpay = async () => {
    if (!cfg.enabled) {
      toast.error('Razorpay is not yet configured. Please contact support.');
      return;
    }
    setBusy(true);
    try {
      const r = await api.post('/payments/create-order', { credits });
      const options = {
        key: r.data.razorpay_key_id, amount: r.data.amount, currency: 'INR',
        name: 'Nikki Tech Labs', description: `${r.data.credits} credits`,
        order_id: r.data.order_id,
        handler: async (resp) => {
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
              credits: r.data.credits,
            });
            toast.success('Payment successful. Credits added!');
            setBuyOpen(false);
            await refreshTenant();
            await load();
          } catch (e) {
            toast.error(e?.response?.data?.detail || 'Verification failed');
          }
        },
        prefill: {},
        theme: { color: '#0EA5A4' },
      };
      // dynamically load razorpay script
      if (!window.Razorpay) {
        await new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://checkout.razorpay.com/v1/checkout.js';
          s.onload = res; s.onerror = rej; document.body.appendChild(s);
        });
      }
      const rz = new window.Razorpay(options);
      rz.open();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to start payment');
    } finally { setBusy(false); }
  };

  return (
    <DashboardShell>
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">Billing</h1>
          <p className="text-muted-foreground mt-1">Manage your plan, credits and invoices.</p>
        </div>
        <Dialog open={buyOpen} onOpenChange={setBuyOpen}>
          <DialogTrigger asChild>
            <Button className="transition-btn lift-1" data-testid="billing-buy-btn"><Coins className="h-4 w-4 mr-1.5" /> Buy credits</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Buy credits</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label htmlFor="credits">Credits</Label>
                <Input id="credits" type="number" min={10} value={credits} onChange={(e) => setCredits(parseInt(e.target.value || '0'))} data-testid="buy-credits-input" />
              </div>
              <div className="text-sm text-muted-foreground">Total: <span className="font-mono text-foreground">{money((credits || 0) * (cfg.credit_price_inr || 2))}</span> (incl. GST)</div>
              {!cfg.enabled && (<div className="text-xs text-warning bg-amber-50 text-amber-900 px-3 py-2 rounded-md">Razorpay not configured yet. Ask super admin to add keys.</div>)}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBuyOpen(false)}>Cancel</Button>
              <Button onClick={openRazorpay} disabled={busy || !cfg.enabled} data-testid="buy-credits-pay-btn">{busy ? 'Starting…' : 'Pay with Razorpay'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* current status */}
      <div className="mt-6 grid md:grid-cols-3 gap-4">
        <Card className="card-elev"><CardContent className="p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Current plan</div>
          <div className="font-display text-2xl font-semibold mt-1">{tenant?.plan_code || 'free'}</div>
        </CardContent></Card>
        <Card className="card-elev"><CardContent className="p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Credits balance</div>
          <div className="font-mono tabular-nums text-2xl font-semibold mt-1">{tenant?.credits_balance ?? 0}</div>
        </CardContent></Card>
        <Card className="card-elev"><CardContent className="p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Rate</div>
          <div className="font-display text-2xl font-semibold mt-1">₹{cfg.credit_price_inr || 2} <span className="text-sm text-muted-foreground">per credit</span></div>
        </CardContent></Card>
      </div>

      {/* Plans */}
      <div className="mt-8">
        <h3 className="font-display text-lg font-semibold">Plans</h3>
        <div className="mt-3 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-52" />) :
            plans.map((p) => (
              <Card key={p.code} className="card-elev" data-testid={`billing-plan-${p.code}`}>
                <CardContent className="p-5">
                  {p.code === (tenant?.plan_code || 'free') && <Badge className="mb-2 bg-teal-100 text-teal-900 hover:bg-teal-100">Current</Badge>}
                  <div className="font-display font-semibold text-lg">{p.name}</div>
                  <div className="mt-2 font-display text-2xl font-semibold">₹{Number(p.price_inr).toLocaleString('en-IN')}{p.price_inr ? <span className="text-xs text-muted-foreground">/mo</span> : ''}</div>
                  <div className="text-xs text-muted-foreground">{p.is_unlimited ? 'Unlimited credits' : `${p.monthly_credits} credits/mo`}</div>
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {(p.features || []).map((f) => <li key={f} className="flex items-start gap-1.5"><Check className="h-3.5 w-3.5 text-primary mt-0.5" /><span>{f}</span></li>)}
                  </ul>
                </CardContent>
              </Card>
            ))
          }
        </div>
      </div>

      {/* Transactions */}
      <div className="mt-8">
        <h3 className="font-display text-lg font-semibold">Transactions</h3>
        <Card className="mt-3 card-elev"><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Date</TableHead><TableHead>Type</TableHead>
              <TableHead className="text-right">Credits</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead><TableHead>Notes</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {loading ? Array.from({length:3}).map((_,i)=><TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-6 w-full" /></TableCell></TableRow>) :
                (txns.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No transactions yet.</TableCell></TableRow> :
                  txns.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{fmtDate(t.created_at)}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px] font-mono">{t.type}</Badge></TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{t.credits_delta > 0 ? '+' : ''}{t.credits_delta}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{money(t.amount_inr)}</TableCell>
                      <TableCell><Badge variant={t.status === 'success' ? 'default' : t.status === 'failed' ? 'destructive' : 'secondary'} className={t.status === 'success' ? 'bg-teal-100 text-teal-900 hover:bg-teal-100' : ''}>{t.status}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[260px] truncate" title={t.notes}>{t.notes || '—'}</TableCell>
                    </TableRow>
                  ))
                )
              }
            </TableBody>
          </Table>
        </CardContent></Card>
      </div>
    </DashboardShell>
  );
}
