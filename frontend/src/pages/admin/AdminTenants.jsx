import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DashboardShell } from '../../components/DashboardShell';
import { Card, CardContent } from '../../components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { api, fmtDate, fmtNum } from '../../lib/api';
import { Coins, Power, Package } from 'lucide-react';

export default function AdminTenants() {
  const [tenants, setTenants] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [credits, setCredits] = useState(100);
  const [planCode, setPlanCode] = useState('');

  const load = async () => {
    setLoading(true);
    const [t, p] = await Promise.all([api.get('/admin/tenants'), api.get('/admin/plans')]);
    setTenants(t.data.tenants); setPlans(p.data.plans);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggleActive = async (t) => {
    try {
      await api.patch(`/admin/tenants/${t.id}`, { is_active: !t.is_active });
      toast.success(`Tenant ${!t.is_active ? 'activated' : 'deactivated'}`);
      load();
    } catch (e) { toast.error(e?.response?.data?.detail || 'Failed'); }
  };

  const grantCredits = async () => {
    if (!selected) return;
    try {
      await api.patch(`/admin/tenants/${selected.id}`, { add_credits: credits });
      toast.success(`Added ${credits} credits to ${selected.name}`);
      setSelected(null); load();
    } catch (e) { toast.error(e?.response?.data?.detail || 'Failed'); }
  };

  const changePlan = async (t, code) => {
    try {
      await api.patch(`/admin/tenants/${t.id}`, { plan_code: code });
      toast.success('Plan updated');
      load();
    } catch (e) { toast.error(e?.response?.data?.detail || 'Failed'); }
  };

  return (
    <DashboardShell admin>
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">Tenants</h1>
        <p className="text-muted-foreground mt-1">Manage all clients on the platform.</p>
      </div>

      <Card className="mt-6 card-elev">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead className="text-right">Credits</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {loading ? Array.from({length: 4}).map((_,i)=>(
                <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-6 w-full" /></TableCell></TableRow>
              )) : tenants.map((t) => (
                <TableRow key={t.id} data-testid={`tenant-row-${t.id}`}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.owner?.email || '—'}</TableCell>
                  <TableCell>
                    <Select defaultValue={t.plan_code} onValueChange={(v) => changePlan(t, v)}>
                      <SelectTrigger className="w-32 h-8 text-xs" data-testid={`plan-select-${t.id}`}><SelectValue /></SelectTrigger>
                      <SelectContent>{plans.map(p => <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{fmtNum(t.credits_balance)}</TableCell>
                  <TableCell>
                    <Badge variant={t.is_active ? 'default' : 'secondary'} className={t.is_active ? 'bg-teal-100 text-teal-900 hover:bg-teal-100' : ''}>{t.is_active ? 'Active' : 'Disabled'}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{fmtDate(t.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Button size="sm" variant="outline" onClick={() => setSelected(t)} data-testid={`grant-btn-${t.id}`}><Coins className="h-3.5 w-3.5 mr-1" /> Grant</Button>
                      <Button size="sm" variant="outline" onClick={() => toggleActive(t)} data-testid={`toggle-btn-${t.id}`}><Power className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Grant credits to {selected?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Credits (positive to add, negative to remove)</Label>
              <Input type="number" value={credits} onChange={(e) => setCredits(parseInt(e.target.value || '0'))} data-testid="grant-credits-input" />
            </div>
            <div className="text-sm text-muted-foreground">Current balance: <span className="font-mono">{selected?.credits_balance}</span></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={grantCredits} data-testid="grant-credits-confirm">Grant</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
