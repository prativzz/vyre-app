import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export default function AnimatedButton({ children, onClick, className, variant = 'primary', disabled = false, type = 'button', ...props }) {
  
  const baseClasses = "relative overflow-hidden font-medium rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-vyre-accent focus-visible:ring-offset-2 focus-visible:ring-offset-vyre-bg";
  
  const variants = {
    primary: "bg-vyre-accent text-vyre-bg hover:bg-vyre-accentHover shadow-[0_2px_8px_rgba(16,185,129,0.2)]",
    secondary: "bg-vyre-secondary text-vyre-text border border-vyre-border hover:bg-vyre-border shadow-sm",
    danger: "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 shadow-sm",
    ghost: "bg-transparent text-vyre-muted hover:text-vyre-text hover:bg-vyre-secondary",
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { y: -1, scale: 1.02 } : {}}
      whileTap={!disabled ? { y: 1, scale: 0.98 } : {}}
      className={cn(baseClasses, variants[variant], className)}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
}
