import React, { useMemo } from 'react';

export default function PixelBackground() {
  const particles = useMemo(() => {
    return Array.from({ length: 120 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() > 0.8 ? 2 : 1, // 1px or 2px squares
      delay: `${Math.random() * 5}s`,
      duration: `${3 + Math.random() * 4}s`,
      opacity: Math.random() * 0.4 + 0.1
    }));
  }, []);

  return (
    <div className="fixed inset-0 z-0 bg-vyre-bg pointer-events-none overflow-hidden">
      {/* Subtle ambient gradient (very dark, almost unnoticeable) */}
      <div className="absolute top-0 left-1/4 w-[50%] h-[30%] bg-vyre-accent/5 blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[40%] h-[30%] bg-vyre-accent/5 blur-[100px]" />
      
      {/* Floating pixel particles */}
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute bg-vyre-accent rounded-sm animate-float shadow-[0_0_4px_rgba(16,185,129,0.6)]"
          style={{
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
      
      {/* Minimal noise grain texture */}
      <div 
        className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />
    </div>
  );
}
