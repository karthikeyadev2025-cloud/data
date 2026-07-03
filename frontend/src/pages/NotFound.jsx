import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Logo } from '../components/Logo';

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="text-center max-w-md">
        <Logo size="lg" />
        <div className="mt-8 font-mono text-primary text-sm">404</div>
        <h1 className="font-display text-3xl font-semibold tracking-tight mt-1">Page not found</h1>
        <p className="text-muted-foreground mt-2">The page you’re looking for doesn’t exist or has moved.</p>
        <Button asChild className="mt-6"><Link to="/">← Back to home</Link></Button>
      </div>
    </div>
  );
}
