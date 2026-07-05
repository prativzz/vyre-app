import React from 'react';
import { cn } from '../../utils/cn';

export default function PixelBadge({ children, count, className, variant = 'danger' }) {
  if (count === 0 && !children) return null;
  
  const variants = {
    danger: "bg-red-500 text-white shadow-sm border border-red-400",
    success: "bg-vyre-accent text-vyre-bg shadow-[0_0_8px_rgba(16,185,129,0.5)] border border-vyre-accent",
    neutral: "bg-vyre-border text-vyre-muted border border-vyre-secondary",
  };

  return (
    <div className={cn(
      "font-pixel text-[10px] uppercase px-1.5 py-0.5 rounded-[2px] inline-flex items-center justify-center leading-none tracking-widest",
      variants[variant],
      className
    )}>
      {children || count}
    </div>
  );
}
