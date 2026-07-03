import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TopNav } from '../components/TopNav';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useBrand } from '../lib/brand';
import { Check, MapPin, Search, Youtube, Instagram, Facebook, ShoppingBag, ArrowRight, Sparkles, ShieldCheck, Zap, Building2 } from 'lucide-react';

const scrapers = [
  { icon: MapPin,      title: 'Maps Scraper',       desc: 'Businesses, phone, address, hours, website, rating.', chips: ['Phone', 'Website', 'Hours'] },
  { icon: Search,      title: 'Search Scraper',     desc: 'Top organic results with snippets from any keyword.', chips: ['Title', 'URL', 'Snippet'] },
  { icon: Youtube,     title: 'Video Scraper',      desc: 'Channels, videos, views, likes, comments.', chips: ['Views', 'Likes', 'Channel'] },
  { icon: Instagram,   title: 'Instagram Scraper',  desc: 'Public profiles — bio, followers, business info.', chips: ['Followers', 'Bio', 'Handle'] },
  { icon: Facebook,    title: 'Facebook Scraper',   desc: 'Public pages, posts, likes, contact info.', chips: ['Page', 'Posts', 'Likes'] },
  { icon: ShoppingBag, title: 'Website Scraper',    desc: 'Any URL — email, phone, product info, socials.', chips: ['Email', 'Price', 'Brand'] },
];

const pricing = [
  { code: 'free',       name: 'Free Trial',  price: 0,    credits: '25 credits',       cta: 'Start free',   highlight: false,
    features: ['25 search credits', 'All scrapers', 'CSV export', 'Search history'] },
  { code: 'starter',    name: 'Starter',     price: 999,  credits: '500 credits / mo', cta: 'Upgrade',      highlight: false,
    features: ['500 credits/month', 'All scrapers', 'CSV + XLSX export', 'Search history', 'Email support'] },
  { code: 'pro',        name: 'Pro',         price: 2999, credits: '2,000 credits / mo', cta: 'Go Pro',    highlight: true,
    features: ['2,000 credits/month', 'All scrapers', 'Priority speed', 'API access', 'Priority support'] },
  { code: 'enterprise', name: 'Enterprise',  price: 9999, credits: 'Unlimited credits', cta: 'Contact sales', highlight: false,
    features: ['Unlimited credits', 'All scrapers', 'Dedicated support', 'Custom integrations', 'SLA'] },
];

const DEMO_QUERIES = [
  { text: 'jewellery shops in Hyderabad',     tab: 'Maps' },
  { text: 'coffee shops in Bangalore',        tab: 'Maps' },
  { text: 'boutiques in Chennai',             tab: 'Maps' },
  { text: 'dental clinics in Kochi',          tab: 'Maps' },
  { text: 'yoga studios in Pune',             tab: 'Maps' },
];

function Typewriter() {
  const [i, setI] = useState(0);
  const [text, setText] = useState('');
  const target = DEMO_QUERIES[i].text;
  useEffect(() => {
    if (text.length < target.length) {
      const t = setTimeout(() => setText(target.slice(0, text.length + 1)), 45);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => { setText(''); setI((i + 1) % DEMO_QUERIES.length); }, 1800);
    return () => clearTimeout(t);
  }, [text, i, target]);
  return (
    <span className="font-mono text-primary">
      {text}<span className="inline-block w-[1px] h-4 bg-primary/70 ml-0.5 animate-pulse" />
    </span>
  );
}

function AnimatedNumber({ value, suffix = '' }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf; const start = performance.now(); const dur = 1400;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className="font-mono tabular-nums">{n.toLocaleString('en-IN')}{suffix}</span>;
}

const LIVE_ROWS = [
  { name: 'Exotica Banjara Hills',   phone: '+91 40 6749 4949', chips: ['IG', 'FB'] },
  { name: 'Jewel of Nizam',          phone: '+91 40 6789 8888', chips: ['IG', 'FB', 'LI'] },
  { name: 'Parampara',               phone: '+91 40 4949 4949', chips: ['IG', 'FB'] },
  { name: 'Pakka Local',             phone: '+91 40 2231 2233', chips: ['IG', 'FB', 'Web'] },
  { name: 'Anandobrahma',            phone: '+91 40 5566 7788', chips: ['Phone'] },
];

export default function Landing() {
  const nav = useNavigate();
  const { brand_name, tagline } = useBrand();
  const [row, setRow] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setRow((r) => (r + 1) % LIVE_ROWS.length), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />

      {/* HERO */}
      <section className="relative overflow-hidden bg-hero-mist bg-noise">
        <div className="container-wide relative py-16 sm:py-24 lg:py-28 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                <Sparkles className="h-3 w-3 mr-1" /> Six scrapers · One dashboard · Real-time
              </Badge>
              <h1 className="font-display font-semibold tracking-tight mt-4 text-4xl sm:text-5xl lg:text-6xl leading-[1.05]">
                Real business contacts.<br />
                <span className="text-primary">Six scrapers.</span> One dashboard.
              </h1>
              <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
                Pull verified phone numbers, emails and social handles from maps, search, video, Instagram, Facebook and any website — export CSV / XLSX in seconds.
              </p>

              {/* Interactive live typewriter search bar */}
              <div className="mt-6 max-w-xl">
                <div className="flex items-center gap-2 rounded-xl border border-border bg-white/80 backdrop-blur px-3 py-2.5 shadow-sm">
                  <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0 truncate text-sm">
                    <Typewriter />
                  </div>
                  <Button size="sm" onClick={() => nav('/login?mode=signup')} className="shrink-0" data-testid="hero-inline-search-btn">Run</Button>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">Try examples above — sign in to run them.</div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button size="lg" onClick={() => nav('/login?mode=signup')} className="transition-btn lift-1" data-testid="hero-cta-primary">
                  Start free — 25 credits <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" asChild data-testid="hero-cta-secondary"><a href="#scrapers">See all scrapers</a></Button>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-3 max-w-lg">
                <div className="p-3 rounded-lg bg-white/70 border border-border">
                  <div className="text-2xl font-display font-semibold text-primary"><AnimatedNumber value={50000} suffix="+" /></div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">Contacts scraped</div>
                </div>
                <div className="p-3 rounded-lg bg-white/70 border border-border">
                  <div className="text-2xl font-display font-semibold text-primary"><AnimatedNumber value={6} /></div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">Real scrapers</div>
                </div>
                <div className="p-3 rounded-lg bg-white/70 border border-border">
                  <div className="text-2xl font-display font-semibold text-primary"><AnimatedNumber value={99} suffix="%" /></div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">Uptime</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Live demo card with rotating rows */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }} className="lg:col-span-5">
            <Card className="border-border card-elev">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Live scrape stream</div>
                  </div>
                  <Badge className="bg-teal-100 text-teal-900 hover:bg-teal-100">Maps</Badge>
                </div>
                <div className="mt-4 space-y-2 h-[220px] overflow-hidden">
                  <AnimatePresence initial={false} mode="popLayout">
                    {LIVE_ROWS.map((r, idx) => {
                      const active = idx === row;
                      return active ? (
                        <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.5 }}
                          className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium truncate">{r.name}</div>
                            <Badge variant="outline" className="text-[10px]">just now</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground font-mono tabular-nums mt-0.5">{r.phone}</div>
                          <div className="mt-1.5 flex gap-1">{r.chips.map((c) => <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-border font-mono">{c}</span>)}</div>
                        </motion.div>
                      ) : null;
                    })}
                  </AnimatePresence>
                  {/* Trailing rows (blurred) */}
                  {LIVE_ROWS.slice(0, 3).map((r, i) => (
                    <div key={`ghost-${i}`} className="p-3 rounded-lg bg-muted/30 opacity-60">
                      <div className="text-sm font-medium truncate">{r.name}</div>
                      <div className="text-xs text-muted-foreground font-mono tabular-nums">{r.phone}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg border border-border"><div className="text-muted-foreground">Results</div><div className="font-mono tabular-nums text-lg font-semibold">12</div></div>
                  <div className="p-3 rounded-lg border border-border"><div className="text-muted-foreground">With phone</div><div className="font-mono tabular-nums text-lg font-semibold">12</div></div>
                  <div className="p-3 rounded-lg border border-border"><div className="text-muted-foreground">With social</div><div className="font-mono tabular-nums text-lg font-semibold">4</div></div>
                </div>
                <Button className="w-full mt-4 transition-btn" size="sm" onClick={() => nav('/login?mode=signup')} data-testid="hero-demo-run-search-button">Run your own search →</Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Scrapers */}
      <section id="scrapers" className="py-16 sm:py-20">
        <div className="container-wide">
          <div className="max-w-2xl">
            <div className="text-sm text-primary font-medium uppercase tracking-wider">Scrapers</div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mt-2">Six real scrapers. One credit balance.</h2>
            <p className="text-muted-foreground mt-3">Clean, dedup’d rows with phones, emails and social handles — ready to export.</p>
          </div>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {scrapers.map((s, i) => (
              <motion.div key={s.title} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <Card className="h-full card-elev card-elev-hover transition-shadow" data-testid={`scraper-tile-${s.title.split(' ')[0].toLowerCase()}`}>
                  <CardContent className="p-6">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center"><s.icon className="h-5 w-5" /></div>
                    <h3 className="mt-4 font-display font-semibold text-lg tracking-tight">{s.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">{s.chips.map((c) => <Badge key={c} variant="outline" className="font-mono text-[10px]">{c}</Badge>)}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How */}
      <section id="how" className="py-16 sm:py-20 bg-muted/40 border-y border-border">
        <div className="container-wide">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-sm text-primary font-medium uppercase tracking-wider">How it works</div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mt-2">Clean leads in three steps.</h2>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              { icon: Sparkles,    title: 'Choose a scraper', desc: 'Pick from 6 real scrapers built for lead-gen teams.' },
              { icon: Zap,         title: 'Run your search', desc: 'Enter keyword + location. Get real data in seconds.' },
              { icon: ShieldCheck, title: 'Export & reach out', desc: 'Download CSV/XLSX or view in your dashboard.' },
            ].map((s, i) => (
              <Card key={i} className="card-elev">
                <CardContent className="p-6">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center"><s.icon className="h-5 w-5" /></div>
                  <div className="mt-4 text-xs font-mono text-muted-foreground">STEP {i + 1}</div>
                  <h3 className="font-display font-semibold text-lg mt-1">{s.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 sm:py-20">
        <div className="container-wide">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-sm text-primary font-medium uppercase tracking-wider">Pricing</div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mt-2">Simple, transparent pricing.</h2>
            <p className="text-muted-foreground mt-3">Start free — upgrade when you’re ready.</p>
          </div>
          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {pricing.map((p) => (
              <Card key={p.code} className={`relative card-elev ${p.highlight ? 'border-primary ring-1 ring-primary' : ''}`} data-testid={`pricing-${p.code}`}>
                {p.highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><Badge className="bg-primary text-primary-foreground">Most popular</Badge></div>}
                <CardContent className="p-6">
                  <div className="font-display font-semibold text-lg">{p.name}</div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="font-display text-3xl font-semibold">₹{p.price.toLocaleString('en-IN')}</span>
                    <span className="text-sm text-muted-foreground">{p.price ? '/mo' : ''}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{p.credits}</div>
                  <ul className="mt-5 space-y-2 text-sm">
                    {p.features.map((f) => (<li key={f} className="flex items-start gap-2"><Check className="h-4 w-4 mt-0.5 text-primary shrink-0" /><span>{f}</span></li>))}
                  </ul>
                  <Button className="w-full mt-6" variant={p.highlight ? 'default' : 'outline'} onClick={() => nav('/login?mode=signup')} data-testid={`pricing-cta-${p.code}`}>{p.cta}</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
