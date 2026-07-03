import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { Github, Mail } from 'lucide-react';

export function Footer({ brand = 'Nikki Tech Labs', text = 'An innovation by Nikki Tech Labs' }) {
  return (
    <footer className="border-t border-border bg-white" data-testid="site-footer">
      <div className="container-wide py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div className="col-span-2">
          <Logo />
          <p className="mt-3 text-muted-foreground max-w-md">
            Real-time contact data scrapers for Google Maps, Search, YouTube, Instagram, Facebook and e-commerce — built for Indian SMB.
          </p>
          <div className="mt-4 flex items-center gap-3 text-muted-foreground">
            <a href="mailto:adexosindia@gmail.com" className="inline-flex items-center gap-2 hover:text-foreground" data-testid="footer-email"><Mail className="h-4 w-4" /> adexosindia@gmail.com</a>
          </div>
        </div>
        <div>
          <div className="font-semibold text-foreground mb-3 text-sm">Product</div>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link to="/#scrapers" className="hover:text-foreground">Scrapers</Link></li>
            <li><Link to="/#pricing" className="hover:text-foreground">Pricing</Link></li>
            <li><Link to="/login" className="hover:text-foreground" data-testid="footer-signin">Sign in</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-foreground mb-3 text-sm">Company</div>
          <ul className="space-y-2 text-muted-foreground">
            <li><a href="#" className="hover:text-foreground">About</a></li>
            <li><a href="#" className="hover:text-foreground">Terms</a></li>
            <li><a href="#" className="hover:text-foreground">Privacy</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-wide py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} {brand}. All rights reserved.</div>
          <div data-testid="footer-tagline" className="font-medium text-foreground/80">{text}</div>
        </div>
      </div>
    </footer>
  );
}
