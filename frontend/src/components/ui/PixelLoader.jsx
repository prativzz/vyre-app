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

// Global state to persist progress across remounts (App.js -> Dashboard.js)
let globalProgress = 0;
let progressInterval = null;

export default function PixelLoader() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(globalProgress);

  // Rotate messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Smooth continuous loading that survives unmounts
  useEffect(() => {
    // Start global progress if it hasn't already
    if (!progressInterval && globalProgress < 100) {
      // 0 to 100 over ~3 seconds (3000ms). Updates every 30ms -> 100 steps
      progressInterval = setInterval(() => {
        globalProgress += 1;
        if (globalProgress > 99) {
          globalProgress = 99; // Hold at 99 until truly done
          clearInterval(progressInterval);
        }
        setProgress(globalProgress);
      }, 30);
    } else {
      // If interval exists, just sync local state
      const syncInterval = setInterval(() => {
        setProgress(globalProgress);
      }, 30);
      return () => clearInterval(syncInterval);
    }
  }, []);

  // Reset global state if we actually hit 100 somewhere else, 
  // but for now 99 is our holding state until unmount and no remount.
  // Actually, to make sure it resets on hard refresh, global variables 
  // reset automatically since JS context reloads.

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
        {/* Vyre Logo (same as homepage/login) */}
        <div className="text-center mb-8 relative">
          <div className="absolute inset-0 bg-vyre-accent/10 blur-xl rounded-full scale-150" />
          <h1 className="text-5xl font-bold font-pixel text-vyre-accent tracking-widest uppercase drop-shadow-md">
            Vyre
          </h1>
        </div>

        {/* Loading Bar Container */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-48 sm:w-64 h-1.5 bg-[#181B1F] border border-[#2D323A] rounded overflow-hidden relative">
            <div 
              className="h-full bg-vyre-accent shadow-[0_0_8px_rgba(34,211,166,0.5)] transition-all duration-75 ease-linear"
              style={{ width: `${progress}%` }}
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
