import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export function Logo({ size = 'md', linkTo = '/' }) {
  const s = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-lg';
  const box = size === 'lg' ? 'h-10 w-10' : size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';
  const el = (
    <span className="flex items-center gap-2.5">
      <motion.span
        initial={{ rotate: -8, scale: 0.9 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className={`${box} rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 grid place-items-center text-white shadow-sm`}
      >
        <Sparkles className="h-4 w-4" strokeWidth={2.5} />
      </motion.span>
      <span className={`font-display font-semibold tracking-tight ${s}`}>Nikki<span className="text-primary">.</span></span>
    </span>
  );
  return linkTo ? <Link to={linkTo} data-testid="logo-link" className="inline-flex">{el}</Link> : el;
}
