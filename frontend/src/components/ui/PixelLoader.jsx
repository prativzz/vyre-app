import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PixelBackground from '../layout/PixelBackground';

const MESSAGES = [
  'INITIALIZING VYRE...',
  'VERIFYING SESSION...',
  'CONNECTING TO SERVERS...',
  'SYNCING FRIENDS...',
  'RESTORING WORKSPACE...',
  'FINALIZING...',
  'ENTERING VYRE...'
];

// Global states to persist progress and prevent animation restarts across unmounts
const APP_BOOT_TIME = Date.now();
const BOOT_DURATION = 2500;
let globalMsgIndex = 0;
let hasMountedOnce = false;

export default function PixelLoader() {
  const [msgIndex, setMsgIndex] = useState(globalMsgIndex);
  const [progress, setProgress] = useState(() => {
    const elapsed = Date.now() - APP_BOOT_TIME;
    return Math.min(Math.floor((elapsed / BOOT_DURATION) * 100), 100);
  });

  // Handle message rotation globally
  useEffect(() => {
    const interval = setInterval(() => {
      globalMsgIndex = (globalMsgIndex + 1) % MESSAGES.length;
      setMsgIndex(globalMsgIndex);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  // Time-based deterministic progress
  useEffect(() => {
    const updateProgress = () => {
      const elapsed = Date.now() - APP_BOOT_TIME;
      let nextProgress = Math.floor((elapsed / BOOT_DURATION) * 100);
      
      if (nextProgress > 100) {
        nextProgress = 100;
      }
      setProgress(nextProgress);
    };

    updateProgress();
    const interval = setInterval(updateProgress, 30);
    
    return () => clearInterval(interval);
  }, []);

  // Mark as mounted to prevent fade-in on remounts
  useEffect(() => {
    hasMountedOnce = true;
  }, []);

  // Genius clone-and-fade trick to animate unmount without modifying parent components
  useEffect(() => {
    return () => {
      // If we are unmounting and progress is complete, perform the seamless fade-out
      if (Date.now() - APP_BOOT_TIME >= BOOT_DURATION) {
        const loaderDom = document.getElementById('vyre-pixel-loader');
        if (loaderDom) {
          const clone = loaderDom.cloneNode(true);
          clone.id = 'vyre-pixel-loader-clone'; // prevent ID collision
          
          // Ensure clone stays exactly where it was, over the entire screen
          clone.style.position = 'fixed';
          clone.style.top = '0';
          clone.style.left = '0';
          clone.style.width = '100vw';
          clone.style.height = '100vh';
          clone.style.zIndex = '99999';
          clone.style.transition = 'opacity 300ms ease-in-out';
          
          document.body.appendChild(clone);
          
          // Wait 150ms as requested, then fade out over 300ms
          setTimeout(() => {
            clone.style.opacity = '0';
          }, 150);
          
          // Remove from DOM after fade completes
          setTimeout(() => {
            if (document.body.contains(clone)) {
              document.body.removeChild(clone);
            }
          }, 500); // 150 + 300 + 50 buffer
        }
      }
    };
  }, []);

  return (
    <div 
      id="vyre-pixel-loader"
      className="h-screen w-screen flex flex-col items-center justify-center bg-[#0F1113] text-vyre-text relative overflow-hidden"
    >
      {/* Extremely subtle background enhancements */}
      <div className="absolute inset-0 opacity-[0.4] pointer-events-none grayscale">
        <PixelBackground />
      </div>
      <div className="absolute inset-0 bg-[#0F1113]/90 pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>

      <motion.div 
        initial={!hasMountedOnce ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="z-10 flex flex-col items-center"
      >
        {/* Vyre Logo - Printed, matte, no glow */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold font-pixel text-[#22D3A6] opacity-90 tracking-[0.25em] uppercase">
            Vyre
          </h1>
        </div>

        {/* Loading Bar Container - Matte and subtle */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-48 sm:w-64 h-1.5 bg-[#141619] border border-[#23272C] overflow-hidden relative">
            <div 
              className="h-full bg-[#1AA985]" // Darker, flatter emerald
              style={{ width: `${progress}%` }} 
            />
          </div>
          <div className="font-pixel text-[#1AA985] text-sm w-12 text-right tracking-widest">
            {progress}%
          </div>
        </div>

        {/* Boot Messages */}
        <div className="h-6 relative w-72 flex justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={MESSAGES[msgIndex]}
              initial={!hasMountedOnce ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute font-pixel text-[#70767D] text-xs tracking-[0.25em] uppercase text-center"
            >
              {MESSAGES[msgIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
