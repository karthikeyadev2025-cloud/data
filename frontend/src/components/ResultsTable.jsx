import { useState, useEffect } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ExternalLink, Instagram, Facebook, Linkedin, Twitter, Youtube, Globe, Phone, Mail, MessageSquare, Check, Plus, FolderPlus, Trash2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { api } from '../lib/api';
import { toast } from 'sonner';

const socialIcons = { instagram: Instagram, facebook: Facebook, linkedin: Linkedin, twitter: Twitter, youtube: Youtube };

function SocialLink({ kind, url }) {
  if (!url) return null;
  const Icon = socialIcons[kind] || Globe;
  return (
    <a href={url} target="_blank" rel="noreferrer noopener" title={url}
       className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
       data-testid={`result-social-${kind}`}>
      <Icon className="h-3.5 w-3.5" />
    </a>
  );
}

export function ResultsTable({ rows, empty = 'No results.', showRemove = false, onRemove = null }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [lists, setLists] = useState([]);
  const [selectedListId, setSelectedListId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load lists on mount to populate the save-to dropdown
    api.get('/lists')
      .then((r) => setLists(r.data.lists))
      .catch(() => {});
  }, []);

  if (!rows || rows.length === 0) {
    return <div className="p-10 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">{empty}</div>;
  }

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(rows.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id, checked) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(x => x !== id));
    }
  };

  const handleSaveToList = () => {
    if (!selectedListId) {
      toast.error('Please select a list first');
      return;
    }
    if (selectedIds.length === 0) {
      toast.error('No contacts selected');
      return;
    }
    setSaving(true);
    api.post(`/lists/${selectedListId}/items`, { result_ids: selectedIds })
      .then((r) => {
        toast.success(`Successfully saved ${r.data.added} leads to list!`);
        setSelectedIds([]);
      })
      .catch(() => toast.error('Failed to save to list'))
      .finally(() => setSaving(false));
  };

  const getWhatsAppLink = (phone) => {
    if (!phone) return '#';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    return `https://wa.me/${cleaned}`;
  };

  const renderEmailStatus = (r) => {
    const status = r.extra?.email_status;
    if (!status) return null;
    switch (status) {
      case 'valid':
        return <Badge className="ml-1 bg-green-100 text-green-800 border-none font-mono text-[9px]">Valid</Badge>;
      case 'invalid':
        return <Badge className="ml-1 bg-red-100 text-red-800 border-none font-mono text-[9px]">Invalid</Badge>;
      case 'catch_all':
        return <Badge className="ml-1 bg-amber-100 text-amber-800 border-none font-mono text-[9px]">Catch-All</Badge>;
      default:
        return <Badge className="ml-1 bg-gray-100 text-gray-800 border-none font-mono text-[9px]">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-3">
      {/* Action Bar for Lists saving */}
      {!showRemove && lists.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-2 p-3 bg-muted/40 border border-border rounded-xl">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{selectedIds.length}</span> selected of {rows.length}
          </div>
          <div className="flex items-center gap-2">
            <select
              className="border border-border rounded-lg px-2.5 py-1.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              value={selectedListId}
              onChange={(e) => setSelectedListId(e.target.value)}
              data-testid="bulk-list-select"
            >
              <option value="">-- Choose List --</option>
              {lists.map(lst => (
                <option key={lst.id} value={lst.id}>{lst.name} ({lst.count || 0})</option>
              ))}
            </select>
            <Button
              size="sm"
              disabled={selectedIds.length === 0 || !selectedListId || saving}
              onClick={handleSaveToList}
              data-testid="bulk-list-save-btn"
            >
              <FolderPlus className="h-3.5 w-3.5 mr-1" /> Save to List
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card card-elev overflow-hidden">
        <ScrollArea className="w-full">
          <div className="min-w-[1050px]">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  {!showRemove && (
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        className="rounded border-border text-primary focus:ring-primary"
                        checked={selectedIds.length === rows.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </TableHead>
                  )}
                  <TableHead className="font-medium">Name</TableHead>
                  <TableHead>Phone / WhatsApp</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-center">Socials</TableHead>
                  <TableHead className="text-center">Rating</TableHead>
                  {showRemove && <TableHead className="text-right w-20"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={i} data-testid={`result-row-${i}`} className="hover:bg-muted/40">
                    {!showRemove && (
                      <TableCell>
                        <input
                          type="checkbox"
                          className="rounded border-border text-primary focus:ring-primary"
                          checked={selectedIds.includes(r.id)}
                          onChange={(e) => handleSelectRow(r.id, e.target.checked)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium max-w-[200px] truncate" title={r.name}>{r.name || '—'}</TableCell>
                    <TableCell>
                      {r.phone ? (
                        <div className="flex items-center gap-1.5">
                          <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1 text-sm hover:text-primary">
                            <Phone className="h-3.5 w-3.5" /> {r.phone}
                          </a>
                          <a
                            href={getWhatsAppLink(r.phone)}
                            target="_blank"
                            rel="noreferrer noopener"
                            title="Chat on WhatsApp"
                            className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 transition-colors border border-green-200"
                            data-testid={`whatsapp-chat-${i}`}
                          >
                            <MessageSquare className="h-3 w-3" />
                          </a>
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {r.email ? (
                        <div className="flex items-center gap-1.5 max-w-[200px]">
                          <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1 text-sm hover:text-primary truncate">
                            <Mail className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{r.email}</span>
                          </a>
                          {renderEmailStatus(r)}
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {r.website ? (
                        <a href={r.website} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 text-sm hover:text-primary max-w-[160px] truncate">
                          <Globe className="h-3.5 w-3.5" /> <span className="truncate">{r.website.replace(/^https?:\/\//, '')}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="max-w-[200px] text-sm text-muted-foreground truncate" title={r.address}>{r.address || '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 justify-center">
                        <SocialLink kind="instagram" url={r.instagram} />
                        <SocialLink kind="facebook"  url={r.facebook} />
                        <SocialLink kind="linkedin"  url={r.linkedin} />
                        <SocialLink kind="twitter"   url={r.twitter} />
                        <SocialLink kind="youtube"   url={r.youtube} />
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono tabular-nums">
                      {r.rating ? <Badge variant="secondary">{Number(r.rating).toFixed(1)} ★</Badge> : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    {showRemove && onRemove && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/15"
                          onClick={() => onRemove(r)}
                          title="Remove from list"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

