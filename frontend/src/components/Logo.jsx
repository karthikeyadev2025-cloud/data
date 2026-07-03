import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

/**
 * Custom SVG logo mark: three animated “scan pulses” converging into a hub —
 * represents finding contacts from multiple sources. Fully self-contained SVG,
 * scales cleanly, uses currentColor so it inherits the primary theme.
 */
export function LogoMark({ className = 'h-9 w-9' }) {
  return (
    <motion.span
      initial={{ rotate: -6, scale: 0.9, opacity: 0 }}
      animate={{ rotate: 0, scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      className={`inline-flex ${className} rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 items-center justify-center text-white shadow-sm relative overflow-hidden`}
    >
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-[62%] w-[62%]">
        {/* Radar arcs */}
        <path d="M6 22a12 12 0 0 1 20 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.65" />
        <path d="M10 22a8 8 0 0 1 12 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
        <path d="M13.5 22a4.5 4.5 0 0 1 5 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        {/* Center dot */}
        <circle cx="16" cy="22" r="1.8" fill="currentColor" />
        {/* Scanning ray */}
        <path d="M16 22 L23 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
        <circle cx="23" cy="8" r="1.6" fill="currentColor" />
      </svg>
    </motion.span>
  );
}

export function Logo({ size = 'md', linkTo = '/', brand = 'Nikki' }) {
  const nameSize = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-lg';
  const boxSize = size === 'lg' ? 'h-10 w-10' : size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';
  // Split into label and tld-like dot for style
  const label = (brand || 'Nikki').trim();
  const el = (
    <span className="flex items-center gap-2.5">
      <LogoMark className={boxSize} />
      <span className={`font-display font-semibold tracking-tight ${nameSize}`}>
        {label}<span className="text-primary">.</span>
      </span>
    </span>
  );
  return linkTo ? <Link to={linkTo} data-testid="logo-link" className="inline-flex">{el}</Link> : el;
}
