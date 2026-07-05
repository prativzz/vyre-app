import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export default function PixelPanel({ children, className, ...props }) {
  return (
    <motion.div
      className={cn(
        'bg-vyre-card border border-vyre-border rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.4)] relative overflow-hidden',
        className
      )}
      {...props}
    >
      {/* Subtle pixel corner accents (optional) */}
      <div className="absolute top-0 left-0 w-1 h-1 bg-vyre-secondary opacity-50" />
      <div className="absolute top-0 right-0 w-1 h-1 bg-vyre-secondary opacity-50" />
      <div className="absolute bottom-0 left-0 w-1 h-1 bg-vyre-secondary opacity-50" />
      <div className="absolute bottom-0 right-0 w-1 h-1 bg-vyre-secondary opacity-50" />
      
      {children}
    </motion.div>
  );
}
