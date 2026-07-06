import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PixelBackground from '../layout/PixelBackground';

const MESSAGES = [
  'INITIALIZING VYRE...',
  'CONNECTING NODES...',
  'VERIFYING SESSION...',
  'SYNCING CHANNELS...',
  'RESTORING CONNECTION...',
  'LOADING WORKSPACE...'
];

// Helper to generate a 12x12 Pixel V path
const PixelV = ({ progress }) => {
  // A V shape on a 12x12 grid
  const blocks = [
    { x: 1, y: 1 },
    { x: 10, y: 1 },
    { x: 2, y: 3 },
    { x: 9, y: 3 },
    { x: 3, y: 5 },
    { x: 8, y: 5 },
    { x: 4, y: 7 },
    { x: 7, y: 7 },
    { x: 5, y: 9 },
    { x: 6, y: 9 },
    { x: 5, y: 10 },
    { x: 6, y: 10 },
  ];

  // Calculate how many blocks to show based on progress (0-100)
  const visibleBlocks = Math.max(1, Math.floor((progress / 100) * blocks.length));

  return (
    <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-8">
      {/* Background glow */}
      <div className="absolute inset-0 bg-vyre-accent/10 blur-xl rounded-full" />
      
      <svg width="100%" height="100%" viewBox="0 0 12 12" className="drop-shadow-md">
        <AnimatePresence>
          {blocks.map((b, i) => (
            i < visibleBlocks && (
              <motion.rect
                key={`${b.x}-${b.y}`}
                x={b.x}
                y={b.y}
                width="1"
                height="1"
                fill="#22D3A6" // Emerald accent
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            )
          ))}
        </AnimatePresence>
      </svg>
      
      {/* Tiny particles floating into the V */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-vyre-accent/40"
            initial={{ 
              x: Math.random() * 100 - 50, 
              y: Math.random() * 100 - 50,
              opacity: 0
            }}
            animate={{
              x: 0,
              y: 0,
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut"
            }}
            style={{
              left: '50%',
              top: '50%'
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default function PixelLoader() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Rotate messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Fake chunk loading progress
  useEffect(() => {
    const fillInterval = setInterval(() => {
      setProgress(p => {
        // Jump by discrete chunk amounts (2-8%) to feel like chunk loading
        const jump = Math.floor(Math.random() * 7) + 2;
        const next = p + jump;
        return next > 99 ? 99 : next; // Cap at 99% until actually loaded
      });
    }, 400); // Update every 400ms for a choppy, game-like feel

    return () => clearInterval(fillInterval);
  }, []);

  const totalSegments = 20;
  const activeSegments = Math.floor((progress / 100) * totalSegments);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#111315] text-vyre-text relative overflow-hidden">
      {/* Background Enhancements */}
      <PixelBackground />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent to-[#111315]/80 pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 flex flex-col items-center"
      >
        <PixelV progress={progress} />

        {/* Loading Bar Container */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-48 sm:w-56 h-3 bg-[#181B1F] border border-[#2D323A] p-0.5 flex gap-[2px]">
            {[...Array(totalSegments)].map((_, i) => (
              <div 
                key={i} 
                className={`h-full flex-1 transition-colors duration-100 ease-out ${
                  i < activeSegments 
                    ? 'bg-vyre-accent shadow-[0_0_8px_rgba(34,211,166,0.5)]' 
                    : 'bg-transparent'
                }`}
              />
            ))}
          </div>
          <div className="font-pixel text-vyre-accent text-sm w-12 text-right">
            {progress}%
          </div>
        </div>

        {/* Boot Messages */}
        <div className="h-6 relative w-64 flex justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={MESSAGES[msgIndex]}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute font-pixel text-[#A5ABB3] text-xs sm:text-sm tracking-[0.3em] uppercase text-center"
            >
              {MESSAGES[msgIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
