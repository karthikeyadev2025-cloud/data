import { TopNav } from '../components/TopNav';
import { Footer } from '../components/Footer';
import { useBrand } from '../lib/brand';

export default function Terms() {
  const { brand_name } = useBrand();
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <main className="flex-1 container-narrow py-16 sm:py-20 prose prose-slate max-w-3xl">
        <div className="text-sm uppercase tracking-wider text-primary font-medium">Legal</div>
        <h1 className="font-display text-4xl font-semibold tracking-tight mt-2">Terms of Service</h1>
        <p className="text-muted-foreground text-sm mt-2">Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <div className="mt-8 space-y-6 text-sm sm:text-base leading-relaxed text-foreground">
          <p>Welcome to {brand_name}. By creating an account or using our services, you agree to these terms.</p>
          <div><h2 className="font-display text-xl font-semibold mt-6">1. Service</h2>
            <p className="text-muted-foreground mt-2">{brand_name} provides tools that help you discover publicly available business contact information for sales and outreach. You use credits to run searches; unused credits do not expire unless your account is disabled.</p>
          </div>
          <div><h2 className="font-display text-xl font-semibold mt-6">2. Acceptable use</h2>
            <p className="text-muted-foreground mt-2">You agree not to use our services to send spam, harass individuals, or violate anti-spam or data-protection laws (including CAN-SPAM, GDPR and Indian IT Act). You are responsible for the way you use the data you retrieve.</p>
          </div>
          <div><h2 className="font-display text-xl font-semibold mt-6">3. Payments</h2>
            <p className="text-muted-foreground mt-2">All charges are in Indian Rupees (₹) and processed securely via our payment partner. Prices, plans and credit rates may change; changes will not apply retroactively.</p>
          </div>
          <div><h2 className="font-display text-xl font-semibold mt-6">4. Refunds</h2>
            <p className="text-muted-foreground mt-2">Unused credits are refundable at our discretion within 7 days of purchase if there has been no meaningful usage. Open a support ticket to request a refund.</p>
          </div>
          <div><h2 className="font-display text-xl font-semibold mt-6">5. Termination</h2>
            <p className="text-muted-foreground mt-2">We may suspend or terminate accounts that violate these terms. You may request account deletion at any time.</p>
          </div>
          <div><h2 className="font-display text-xl font-semibold mt-6">6. Limitation of liability</h2>
            <p className="text-muted-foreground mt-2">Our services are provided “as is”. To the fullest extent permitted by law, we are not liable for indirect or consequential damages arising from your use of the platform.</p>
          </div>
          <div><h2 className="font-display text-xl font-semibold mt-6">7. Contact</h2>
            <p className="text-muted-foreground mt-2">For questions about these terms, sign in and open a support ticket.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
