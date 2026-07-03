import { TopNav } from '../components/TopNav';
import { Footer } from '../components/Footer';
import { useBrand } from '../lib/brand';
import { Card, CardContent } from '../components/ui/card';
import { ShieldCheck, Zap, Users, Globe2 } from 'lucide-react';

export default function About() {
  const { brand_name } = useBrand();
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <main className="flex-1 container-wide py-16 sm:py-24">
        <div className="max-w-3xl">
          <div className="text-sm uppercase tracking-wider text-primary font-medium">About</div>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight mt-2">Real contact data, delivered faster.</h1>
          <p className="text-muted-foreground mt-5 text-lg leading-relaxed">
            {brand_name} helps sales teams, agencies and founders pull verified business contacts — phone numbers, emails and social handles — from maps, search, video, social profiles and any website. All in one dashboard, with CSV / XLSX exports, credit-based billing and a professional support desk.
          </p>
        </div>
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Zap, title: 'Fast', desc: 'Six scrapers run in parallel. Get results in seconds, not hours.' },
            { icon: ShieldCheck, title: 'Reliable', desc: 'Real business APIs — not scraped-and-broken workarounds.' },
            { icon: Users, title: 'Multi-tenant', desc: 'Teams, tenants, credits and permissions all built in.' },
            { icon: Globe2, title: 'Global-ready', desc: 'Works for any city or country. INR + international billing.' },
          ].map((f) => (
            <Card key={f.title} className="card-elev">
              <CardContent className="p-6">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center"><f.icon className="h-5 w-5" /></div>
                <h3 className="font-display font-semibold mt-4">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
