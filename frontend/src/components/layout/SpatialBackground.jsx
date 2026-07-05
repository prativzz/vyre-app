import React from 'react';
import { motion } from 'framer-motion';

export default function SpatialBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#0A0A0B] pointer-events-none">
      {/* Base noise texture for depth */}
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />
      
      {/* Ambient Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-blue-900/30 blur-[120px]"
      />
      
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
          x: [0, -40, 0],
          y: [0, 60, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-[30%] -right-[10%] w-[50%] h-[70%] rounded-full bg-violet-900/20 blur-[140px]"
      />

      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        className="absolute -bottom-[20%] left-[20%] w-[70%] h-[50%] rounded-full bg-indigo-900/20 blur-[130px]"
      />
      
      {/* Global Vignette for depth */}
      <div className="absolute inset-0 bg-black/40 [mask-image:radial-gradient(circle_at_center,transparent_0%,black_100%)]" />
    </div>
  );
}
