import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TopNav } from '../components/TopNav';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Check, MapPin, Search, Youtube, Instagram, Facebook, ShoppingBag, Globe, ArrowRight, Sparkles, ShieldCheck, Zap } from 'lucide-react';

const scrapers = [
  { icon: MapPin,       title: 'Google Maps Scraper',     desc: 'Businesses, phone, address, hours, website, rating.', chips: ['Phone', 'Website', 'Hours'] },
  { icon: Search,       title: 'Google Search Scraper',   desc: 'Top organic results with snippets — via SerpAPI.', chips: ['Title', 'URL', 'Snippet'] },
  { icon: Youtube,      title: 'YouTube Scraper',         desc: 'Channels, videos, views, likes, comments.', chips: ['Views', 'Likes', 'Channel'] },
  { icon: Instagram,    title: 'Instagram Scraper',       desc: 'Public profile details via Apify actor.', chips: ['Bio', 'Followers', 'Handle'] },
  { icon: Facebook,     title: 'Facebook Posts Scraper',  desc: 'Public Facebook pages & posts via Apify.', chips: ['Page', 'Posts', 'Likes'] },
  { icon: ShoppingBag,  title: 'E-commerce Scraper',      desc: 'Product name, price, brand, images from any store.', chips: ['Price', 'Brand', 'SKU'] },
];

const pricing = [
  { code: 'free',       name: 'Free Trial',  price: 0,    credits: '25 credits',       cta: 'Start free',   highlight: false,
    features: ['25 search credits', 'Google Maps scraper', 'Website enrichment', 'CSV export'] },
  { code: 'starter',    name: 'Starter',     price: 999,  credits: '500 credits / mo', cta: 'Upgrade',      highlight: false,
    features: ['500 credits/month', 'All scrapers', 'CSV + XLSX export', 'Search history', 'Email support'] },
  { code: 'pro',        name: 'Pro',         price: 2999, credits: '2,000 credits / mo', cta: 'Go Pro',    highlight: true,
    features: ['2,000 credits/month', 'All scrapers', 'Priority speed', 'API access', 'Priority support'] },
  { code: 'enterprise', name: 'Enterprise',  price: 9999, credits: 'Unlimited credits', cta: 'Contact sales', highlight: false,
    features: ['Unlimited credits', 'All scrapers', 'Dedicated support', 'Custom integrations', 'SLA'] },
];

export default function Landing() {
  const nav = useNavigate();
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />

      {/* HERO */}
      <section className="relative overflow-hidden bg-hero-mist bg-noise">
        <div className="container-wide relative py-16 sm:py-24 lg:py-28 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                <Sparkles className="h-3 w-3 mr-1" /> Made for Indian SMB · INR billing · GST invoices
              </Badge>
              <h1 className="font-display font-semibold tracking-tight mt-4 text-4xl sm:text-5xl lg:text-6xl leading-[1.05]">
                Real business contacts.<br />
                <span className="text-primary">One dashboard.</span> Six scrapers.
              </h1>
              <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
                Pull real phone numbers, emails and social handles from Google Maps, Search, YouTube, Instagram, Facebook and any e-commerce URL — export CSV/XLSX in seconds.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button size="lg" onClick={() => nav('/login?mode=signup')} className="transition-btn lift-1" data-testid="hero-cta-primary">
                  Start free — 25 credits <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" asChild data-testid="hero-cta-secondary">
                  <a href="#scrapers">See all scrapers</a>
                </Button>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                <div className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> No credit card required</div>
                <div className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> Razorpay payments</div>
                <div className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> Excel-ready exports</div>
              </div>
            </motion.div>
          </div>

          {/* Demo card */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }} className="lg:col-span-5">
            <Card className="border-border card-elev">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Live demo</div>
                  <Badge className="bg-teal-100 text-teal-900 hover:bg-teal-100">Google Maps</Badge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { name: 'Exotica Banjara Hills', phone: '+91 40 6749 4949', social: 'IG · FB' },
                    { name: 'Jewel of Nizam', phone: '+91 40 6789 8888', social: 'IG · FB · LI' },
                    { name: 'Parampara', phone: '+91 40 4949 4949', social: 'IG · FB' },
                  ].map((r, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="p-3 rounded-lg bg-muted/60">
                      <div className="text-sm font-medium truncate">{r.name}</div>
                      <div className="text-xs text-muted-foreground font-mono tabular-nums">{r.phone}</div>
                      <div className="text-[10px] text-primary mt-1 font-medium tracking-wide">{r.social}</div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg border border-border"><div className="text-muted-foreground">Total results</div><div className="font-mono tabular-nums text-lg font-semibold">12</div></div>
                  <div className="p-3 rounded-lg border border-border"><div className="text-muted-foreground">With phone</div><div className="font-mono tabular-nums text-lg font-semibold">12</div></div>
                  <div className="p-3 rounded-lg border border-border"><div className="text-muted-foreground">With socials</div><div className="font-mono tabular-nums text-lg font-semibold">4</div></div>
                </div>
                <Button className="w-full mt-4 transition-btn" size="sm" onClick={() => nav('/login?mode=signup')} data-testid="hero-demo-run-search-button">Try it yourself →</Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Scrapers bento */}
      <section id="scrapers" className="py-16 sm:py-20">
        <div className="container-wide">
          <div className="max-w-2xl">
            <div className="text-sm text-primary font-medium uppercase tracking-wider">Scrapers</div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mt-2">Six real scrapers. One credit balance.</h2>
            <p className="text-muted-foreground mt-3">Every scraper returns clean, dedup’d rows with phones, emails and social handles — ready to export.</p>
          </div>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {scrapers.map((s, i) => (
              <motion.div key={s.title} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <Card className="h-full card-elev card-elev-hover transition-shadow" data-testid={`scraper-tile-${s.title.split(' ')[0].toLowerCase()}`}>
                  <CardContent className="p-6">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                      <s.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-display font-semibold text-lg tracking-tight">{s.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {s.chips.map((c) => <Badge key={c} variant="outline" className="font-mono text-[10px]">{c}</Badge>)}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-16 sm:py-20 bg-muted/40 border-y border-border">
        <div className="container-wide">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-sm text-primary font-medium uppercase tracking-wider">How it works</div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mt-2">Get clean leads in three steps.</h2>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              { icon: Sparkles, title: 'Choose a scraper', desc: 'Pick from 6 real scrapers built for Indian SMB use cases.' },
              { icon: Zap,      title: 'Run your search', desc: 'Enter keyword + location. Get real data in seconds.' },
              { icon: ShieldCheck, title: 'Export & reach out', desc: 'Download CSV/XLSX or view in your dashboard. GDPR-friendly.' },
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
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mt-2">Simple INR pricing. GST invoices.</h2>
            <p className="text-muted-foreground mt-3">Powered by Razorpay. Start free — pay only when you’re ready.</p>
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
