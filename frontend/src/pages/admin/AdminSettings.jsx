import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DashboardShell } from '../../components/DashboardShell';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { api } from '../../lib/api';
import { KeyRound, Save, Sparkles } from 'lucide-react';

const SECTIONS = [
  { key: 'google_api_key',            label: 'Google API Key',            hint: 'Used for Google Maps + YouTube scrapers.', secret: true },
  { key: 'youtube_api_key',           label: 'YouTube API Key (optional)', hint: 'Overrides Google key for YouTube only.', secret: true },
  { key: 'serpapi_key',               label: 'SerpAPI Key',                hint: 'Enables Google Search scraper.', secret: true },
  { key: 'apify_token',               label: 'Apify Token',                hint: 'Enables Instagram + Facebook scrapers.', secret: true },
  { key: 'razorpay_key_id',           label: 'Razorpay Key ID',            hint: 'Public part of Razorpay credentials.', secret: false },
  { key: 'razorpay_key_secret',       label: 'Razorpay Key Secret',        hint: 'Secret used to sign & verify orders.', secret: true },
  { key: 'google_oauth_client_id',    label: 'Google OAuth Client ID',     hint: 'For “Sign in with Google” in production.', secret: false },
  { key: 'google_oauth_client_secret',label: 'Google OAuth Client Secret', hint: 'Server-side only. Never expose to frontend.', secret: true },
  { key: 'google_service_account_json',label: 'Google Sheets Service Account JSON', hint: 'Paste the entire contents of the Service Account credentials .json file here.', secret: true },
];

const BRAND = [
  { key: 'brand_name',         label: 'Brand name',       type: 'text' },
  { key: 'footer_text',        label: 'Footer text',      type: 'text' },
  { key: 'support_email',      label: 'Support email',    type: 'email' },
  { key: 'free_trial_credits', label: 'Free trial credits (for new tenants)', type: 'number' },
];

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [values, setValues] = useState({});
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const r = await api.get('/admin/settings');
    setSettings(r.data.settings);
    setValues(r.data.settings);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setBusy(true);
    try {
      const changed = {};
      for (const k of [...SECTIONS.map(s=>s.key), ...BRAND.map(b=>b.key)]) {
        if (values[k] !== settings[k]) {
          changed[k] = values[k] === '' ? null : values[k];
        }
      }
      if (Object.keys(changed).length === 0) { toast.info('No changes'); setBusy(false); return; }
      const r = await api.patch('/admin/settings', changed);
      setSettings(r.data.settings); setValues(r.data.settings);
      toast.success('Settings saved. Changes apply globally.');
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to save');
    } finally { setBusy(false); }
  };

  if (!settings) return (<DashboardShell admin><Skeleton className="h-96 w-full" /></DashboardShell>);

  const set = (k, v) => setValues((s) => ({ ...s, [k]: v }));

  return (
    <DashboardShell admin>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">Platform settings</h1>
          <p className="text-muted-foreground mt-1">API keys and brand config. Changes apply platform-wide instantly.</p>
        </div>
        <Button onClick={save} disabled={busy} data-testid="admin-settings-save-btn" className="transition-btn"><Save className="h-4 w-4 mr-1.5" /> {busy ? 'Saving…' : 'Save all changes'}</Button>
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-4">
        <Card className="card-elev">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4"><KeyRound className="h-4 w-4 text-primary" /><h3 className="font-display font-semibold">API Keys</h3></div>
            <div className="space-y-4">
              {SECTIONS.map((s) => (
                <div key={s.key}>
                  <div className="flex items-center justify-between">
                    <Label htmlFor={s.key}>{s.label}</Label>
                    {values[s.key] && <Badge variant="outline" className="text-[10px] font-mono">SET</Badge>}
                  </div>
                  <Input id={s.key} type={s.secret ? 'password' : 'text'} value={values[s.key] || ''}
                    onChange={(e) => set(s.key, e.target.value)}
                    placeholder={values[s.key] ? '(hidden)' : 'Not configured'}
                    data-testid={`admin-setting-${s.key}`} />
                  <p className="text-xs text-muted-foreground mt-1">{s.hint}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="card-elev">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4"><Sparkles className="h-4 w-4 text-primary" /><h3 className="font-display font-semibold">Branding & Theme</h3></div>
            <div className="space-y-4">
              {BRAND.map((b) => (
                <div key={b.key}>
                  <Label htmlFor={b.key}>{b.label}</Label>
                  {b.type === 'color' ? (
                    <div className="flex items-center gap-3 mt-1">
                      <input id={b.key} type="color" value={values[b.key] || '#0EA5A4'}
                        onChange={(e) => set(b.key, e.target.value)}
                        className="h-10 w-16 rounded-md border border-input cursor-pointer"
                        data-testid={`admin-brand-${b.key}`} />
                      <Input value={values[b.key] || '#0EA5A4'} onChange={(e) => set(b.key, e.target.value)}
                        placeholder="#0EA5A4" className="max-w-[140px] font-mono" />
                      <span className="text-xs text-muted-foreground">Applies platform-wide on save.</span>
                    </div>
                  ) : (
                    <Input id={b.key} type={b.type} value={values[b.key] || (b.type === 'number' ? 0 : '')}
                      onChange={(e) => set(b.key, b.type === 'number' ? parseInt(e.target.value || '0') : e.target.value)}
                      data-testid={`admin-brand-${b.key}`} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
