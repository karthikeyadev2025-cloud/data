import { TopNav } from '../components/TopNav';
import { Footer } from '../components/Footer';
import { useBrand } from '../lib/brand';

export default function Privacy() {
  const { brand_name } = useBrand();
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <main className="flex-1 container-narrow py-16 sm:py-20 max-w-3xl">
        <div className="text-sm uppercase tracking-wider text-primary font-medium">Legal</div>
        <h1 className="font-display text-4xl font-semibold tracking-tight mt-2">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm mt-2">Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <div className="mt-8 space-y-6 text-sm sm:text-base leading-relaxed text-foreground">
          <p>Your privacy matters. This policy explains what information {brand_name} collects and how we use it.</p>
          <div><h2 className="font-display text-xl font-semibold mt-6">Information we collect</h2>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>Account: your email, name, and (if provided) company.</li>
              <li>Search history: the queries you run and the results returned.</li>
              <li>Billing: transaction metadata (we never store card details).</li>
              <li>Usage: browser type, IP and pages visited for security and analytics.</li>
            </ul>
          </div>
          <div><h2 className="font-display text-xl font-semibold mt-6">How we use it</h2>
            <p className="text-muted-foreground mt-2">To operate the platform, secure your account, provide support and improve our services. We never sell your personal information.</p>
          </div>
          <div><h2 className="font-display text-xl font-semibold mt-6">Data retention</h2>
            <p className="text-muted-foreground mt-2">We retain your data for as long as your account is active. On account deletion, personal data is removed within 30 days (some records may be kept longer if required by law).</p>
          </div>
          <div><h2 className="font-display text-xl font-semibold mt-6">Your rights</h2>
            <p className="text-muted-foreground mt-2">You can request access to, correction of, or deletion of your data by opening a support ticket after signing in.</p>
          </div>
          <div><h2 className="font-display text-xl font-semibold mt-6">Security</h2>
            <p className="text-muted-foreground mt-2">We use industry-standard measures: encryption in transit, hashed passwords, least-privilege access, and audited third parties.</p>
          </div>
          <div><h2 className="font-display text-xl font-semibold mt-6">Changes</h2>
            <p className="text-muted-foreground mt-2">If we make material changes to this policy we’ll notify you via the dashboard.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
