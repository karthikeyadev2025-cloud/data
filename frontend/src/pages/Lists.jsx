import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardShell } from '../components/DashboardShell';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { api, fmtDate } from '../lib/api';
import { toast } from 'sonner';
import { List, Plus, Trash2, Pencil, FolderOpen, X } from 'lucide-react';

const COLORS = ['#0EA5A4', '#6366f1', '#f59e0b', '#ef4444', '#22c55e', '#ec4899', '#8b5cf6', '#06b6d4'];

export default function Lists() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');

  const load = () => {
    api.get('/lists').then((r) => setLists(r.data.lists)).catch(() => toast.error('Failed to load lists')).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const create = () => {
    if (!newName.trim()) return;
    api.post('/lists', { name: newName.trim(), description: newDesc.trim() || null, color: newColor })
      .then(() => { toast.success('List created!'); setNewName(''); setNewDesc(''); setShowCreate(false); load(); })
      .catch(() => toast.error('Failed to create list'));
  };

  const rename = (id) => {
    if (!editName.trim()) return;
    api.patch(`/lists/${id}`, { name: editName.trim() })
      .then(() => { toast.success('Renamed'); setEditId(null); load(); })
      .catch(() => toast.error('Rename failed'));
  };

  const remove = (id, name) => {
    if (!window.confirm(`Delete "${name}" and all its saved contacts?`)) return;
    api.delete(`/lists/${id}`)
      .then(() => { toast.success('Deleted'); load(); })
      .catch(() => toast.error('Delete failed'));
  };

  return (
    <DashboardShell>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">My Lists</h1>
          <p className="text-muted-foreground mt-1">Save leads into named lists for easy access and export.</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} data-testid="lists-create-btn">
          <Plus className="h-4 w-4 mr-1.5" /> New List
        </Button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Card className="mt-4 card-elev">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-semibold text-lg">Create a new list</h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowCreate(false)}><X className="h-4 w-4" /></Button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    className="border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="List name (e.g. Hyderabad Restaurants)"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && create()}
                    data-testid="create-list-name"
                    autoFocus
                  />
                  <input
                    className="border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Description (optional)"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && create()}
                    data-testid="create-list-desc"
                  />
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs text-muted-foreground">Color:</span>
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => setNewColor(c)}
                      className={`h-6 w-6 rounded-full border-2 transition-all ${newColor === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
                <Button className="mt-4" onClick={create} data-testid="create-list-submit">Create list</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lists grid */}
      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)
        ) : lists.length === 0 ? (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            <List className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No lists yet. Create your first list and save contacts from search results.</p>
          </div>
        ) : lists.map((lst, i) => (
          <motion.div key={lst.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="card-elev card-elev-hover group relative overflow-hidden" data-testid={`list-card-${lst.id}`}>
              <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: lst.color || '#0EA5A4' }} />
              <CardContent className="p-5 pt-4">
                {editId === lst.id ? (
                  <div className="flex gap-2">
                    <input
                      className="border border-border rounded-lg px-2 py-1 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      value={editName} onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && rename(lst.id)}
                      autoFocus />
                    <Button size="sm" onClick={() => rename(lst.id)}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>Cancel</Button>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-display font-semibold text-lg truncate">{lst.name}</h3>
                      {lst.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{lst.description}</p>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditId(lst.id); setEditName(lst.name); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => remove(lst.id, lst.name)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono tabular-nums">{lst.count || 0} contacts</Badge>
                    <span className="text-xs text-muted-foreground">{fmtDate(lst.created_at)}</span>
                  </div>
                  <Button asChild size="sm" variant="outline" data-testid={`list-open-${lst.id}`}>
                    <Link to={`/lists/${lst.id}`}><FolderOpen className="h-3.5 w-3.5 mr-1" /> Open</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </DashboardShell>
  );
}
