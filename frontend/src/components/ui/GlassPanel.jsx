import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export default function GlassPanel({ 
  children, 
  className, 
  blur = 'md', 
  dark = false,
  interactive = false,
  onClick,
  ...props 
}) {
  const blurClasses = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
  };

  return (
    <motion.div
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl border",
        blurClasses[blur],
        dark 
          ? "bg-gray-900/60 border-gray-700/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.5)]" 
          : "bg-gray-800/40 border-gray-700/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.3)]",
        interactive && "hover:bg-gray-700/50 hover:border-gray-600/50 transition-colors cursor-pointer",
        className
      )}
      {...props}
    >
      {/* Subtle edge highlight */}
      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5 pointer-events-none" />
      {children}
    </motion.div>
  );
}
