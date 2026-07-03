import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DashboardShell } from '../../components/DashboardShell';
import { Card, CardContent } from '../../components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Skeleton } from '../../components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { api } from '../../lib/api';
import { Pencil } from 'lucide-react';

export default function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(null);

  const load = async () => {
    setLoading(true);
    const r = await api.get('/admin/plans');
    setPlans(r.data.plans); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      const body = {
        name: edit.name, price_inr: parseInt(edit.price_inr || 0),
        monthly_credits: parseInt(edit.monthly_credits || 0),
        is_unlimited: !!edit.is_unlimited, active: !!edit.active,
        features: (edit.features_str || '').split('\n').map(s => s.trim()).filter(Boolean),
      };
      await api.patch(`/admin/plans/${edit.code}`, body);
      toast.success('Plan updated');
      setEdit(null); load();
    } catch (e) { toast.error(e?.response?.data?.detail || 'Failed'); }
  };

  return (
    <DashboardShell admin>
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">Plans</h1>
        <p className="text-muted-foreground mt-1">Configure pricing, monthly credits and features per plan.</p>
      </div>

      <Card className="mt-6 card-elev">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead className="text-right">Price (₹)</TableHead>
              <TableHead className="text-right">Credits/mo</TableHead>
              <TableHead>Unlimited?</TableHead><TableHead>Active</TableHead><TableHead className="text-right"></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {loading ? Array.from({length: 4}).map((_,i)=>(<TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-6 w-full" /></TableCell></TableRow>)) :
                plans.map((p) => (
                  <TableRow key={p.code} data-testid={`plan-row-${p.code}`}>
                    <TableCell><Badge variant="outline" className="font-mono text-[10px]">{p.code}</Badge></TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{Number(p.price_inr).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{p.monthly_credits}</TableCell>
                    <TableCell>{p.is_unlimited ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{p.active ? <Badge className="bg-teal-100 text-teal-900 hover:bg-teal-100">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" data-testid={`plan-edit-${p.code}`} onClick={() => setEdit({ ...p, features_str: (p.features || []).join('\n') })}><Pencil className="h-3.5 w-3.5" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit plan: {edit?.code}</DialogTitle></DialogHeader>
          {edit && (
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={edit.name || ''} onChange={(e) => setEdit({...edit, name: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Price (₹)</Label><Input type="number" value={edit.price_inr || 0} onChange={(e) => setEdit({...edit, price_inr: e.target.value})} /></div>
                <div><Label>Monthly credits</Label><Input type="number" value={edit.monthly_credits || 0} onChange={(e) => setEdit({...edit, monthly_credits: e.target.value})} /></div>
              </div>
              <div className="flex items-center gap-2"><Switch checked={!!edit.is_unlimited} onCheckedChange={(v) => setEdit({...edit, is_unlimited: v})} /><Label>Unlimited credits</Label></div>
              <div className="flex items-center gap-2"><Switch checked={!!edit.active} onCheckedChange={(v) => setEdit({...edit, active: v})} /><Label>Active</Label></div>
              <div>
                <Label>Features (one per line)</Label>
                <textarea rows={5} className="w-full border border-input rounded-md p-2 text-sm" value={edit.features_str} onChange={(e) => setEdit({...edit, features_str: e.target.value})} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button>
            <Button onClick={save} data-testid="plan-save-btn">Save plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
