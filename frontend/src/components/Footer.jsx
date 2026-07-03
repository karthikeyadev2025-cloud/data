import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { useBrand } from '../lib/brand';
import { LifeBuoy } from 'lucide-react';

export function Footer() {
  const { brand_name, footer_text } = useBrand();
  return (
    <footer className="border-t border-border bg-white" data-testid="site-footer">
      <div className="container-wide py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div className="col-span-2">
          <Logo brand={brand_name} />
          <p className="mt-3 text-muted-foreground max-w-md">
            {`Real-time contact data scrapers for maps, search, video, social profiles and any website — built for modern SMB & agency teams.`}
          </p>
          <div className="mt-4">
            <Link to="/login" data-testid="footer-support" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
              <LifeBuoy className="h-4 w-4" /> Need help? Sign in to open a support ticket.
            </Link>
          </div>
        </div>
        <div>
          <div className="font-semibold text-foreground mb-3 text-sm">Product</div>
          <ul className="space-y-2 text-muted-foreground">
            <li><a href="/#scrapers" className="hover:text-foreground">Scrapers</a></li>
            <li><a href="/#pricing" className="hover:text-foreground">Pricing</a></li>
            <li><Link to="/login" className="hover:text-foreground" data-testid="footer-signin">Sign in</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-foreground mb-3 text-sm">Company</div>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link to="/about" className="hover:text-foreground" data-testid="footer-about">About</Link></li>
            <li><Link to="/terms" className="hover:text-foreground" data-testid="footer-terms">Terms</Link></li>
            <li><Link to="/privacy" className="hover:text-foreground" data-testid="footer-privacy">Privacy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-wide py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} {brand_name}. All rights reserved.</div>
          <div data-testid="footer-tagline" className="font-medium text-foreground/80">{footer_text}</div>
        </div>
      </div>
    </footer>
  );
}
