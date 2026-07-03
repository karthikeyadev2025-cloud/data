import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from './ui/table';
import { Badge } from './ui/badge';
import { ExternalLink, Instagram, Facebook, Linkedin, Twitter, Youtube, Globe, Phone, Mail } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

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

export function ResultsTable({ rows, empty = 'No results.' }) {
  if (!rows || rows.length === 0) {
    return <div className="p-10 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">{empty}</div>;
  }
  return (
    <div className="rounded-xl border border-border bg-card card-elev overflow-hidden">
      <ScrollArea className="w-full">
        <div className="min-w-[900px]">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-medium">Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-center">Socials</TableHead>
                <TableHead className="text-right">Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i} data-testid={`result-row-${i}`} className="hover:bg-muted/40">
                  <TableCell className="font-medium max-w-[220px] truncate" title={r.name}>{r.name || '—'}</TableCell>
                  <TableCell>
                    {r.phone ? (
                      <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1.5 text-sm hover:text-primary">
                        <Phone className="h-3.5 w-3.5" /> {r.phone}
                      </a>
                    ) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    {r.email ? (
                      <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1.5 text-sm hover:text-primary max-w-[180px] truncate">
                        <Mail className="h-3.5 w-3.5" /> <span className="truncate">{r.email}</span>
                      </a>
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
                  <TableCell className="max-w-[240px] text-sm text-muted-foreground truncate" title={r.address}>{r.address || '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 justify-center">
                      <SocialLink kind="instagram" url={r.instagram} />
                      <SocialLink kind="facebook"  url={r.facebook} />
                      <SocialLink kind="linkedin"  url={r.linkedin} />
                      <SocialLink kind="twitter"   url={r.twitter} />
                      <SocialLink kind="youtube"   url={r.youtube} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {r.rating ? <Badge variant="secondary">{Number(r.rating).toFixed(1)} ★</Badge> : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </div>
  );
}
