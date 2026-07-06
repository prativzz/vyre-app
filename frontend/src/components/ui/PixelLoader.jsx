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

// Initialize once when the application loads
const APP_BOOT_TIME = Date.now();
const BOOT_DURATION = 2500; // 2.5 seconds total boot sequence

export default function PixelLoader() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Rotate messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 800); // slightly faster rotation for urgency
    return () => clearInterval(interval);
  }, []);

  // Time-based deterministic progress
  // Immune to StrictMode double-mounting and App -> Dashboard remounts
  useEffect(() => {
    const updateProgress = () => {
      const elapsed = Date.now() - APP_BOOT_TIME;
      let nextProgress = Math.floor((elapsed / BOOT_DURATION) * 100);
      
      if (nextProgress > 99) {
        nextProgress = 99; // Hold at 99 until real data is ready
      }
      setProgress(nextProgress);
    };

    updateProgress(); // initial call
    const interval = setInterval(updateProgress, 30); // 30ms for subtle pixel steps
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#111315] text-vyre-text relative overflow-hidden">
      {/* Background Enhancements */}
      <PixelBackground />
      {/* Reduced vignette intensity, removed bloom */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#111315_100%)] opacity-80 pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>

      {/* No pulsing or aggressive animation */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="z-10 flex flex-col items-center"
      >
        {/* Vyre Logo - Completely flat and matte */}
        <div className="text-center mb-10 relative">
          <h1 className="text-5xl font-bold font-pixel text-vyre-accent tracking-widest uppercase">
            Vyre
          </h1>
        </div>

        {/* Loading Bar Container - Matte and subtle */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-48 sm:w-64 h-1.5 bg-[#181B1F] border border-[#2D323A] overflow-hidden relative">
            <div 
              className="h-full bg-vyre-accent"
              style={{ width: `${progress}%` }} 
              // Notice: removed CSS transition completely to allow snapping/stepping
            />
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
              transition={{ duration: 0.3 }}
              className="absolute font-pixel text-[#828890] text-xs tracking-[0.2em] uppercase text-center"
            >
              {MESSAGES[msgIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
