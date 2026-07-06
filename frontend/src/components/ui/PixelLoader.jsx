import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
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

const BOOT_DURATION = 2500;
const APP_BOOT_TIME = Date.now();

// This is the actual continuous visual component that NEVER unmounts during load
function ContinuousLoaderUI({ isFadingOut }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Status text rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(prev => (prev + 1) % MESSAGES.length);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  // Time-based deterministic progress
  useEffect(() => {
    const updateProgress = () => {
      const elapsed = Date.now() - APP_BOOT_TIME;
      let nextProgress = Math.floor((elapsed / BOOT_DURATION) * 100);
      if (nextProgress > 100) nextProgress = 100;
      setProgress(nextProgress);
    };
    updateProgress();
    const interval = setInterval(updateProgress, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="fixed inset-0 flex flex-col items-center justify-center bg-[#0B0D0F] text-vyre-text overflow-hidden z-[99999]"
      style={{
        transition: 'opacity 250ms ease-in-out',
        opacity: isFadingOut ? 0 : 1,
        pointerEvents: isFadingOut ? 'none' : 'auto'
      }}
    >
      {/* Background Enhancements - Drastically reduced particle visibility */}
      <div className="absolute inset-0 opacity-[0.25] pointer-events-none grayscale">
        <PixelBackground />
      </div>
      <div className="absolute inset-0 bg-[#0B0D0F]/95 pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>

      <div className="z-10 flex flex-col items-center">
        {/* Vyre Logo - Printed, matte, extremely crisp (no anti-aliasing) */}
        <div className="text-center mb-14">
          <h1 
            className="text-5xl font-bold font-pixel text-[#168E6F] opacity-90 tracking-[0.3em] uppercase" 
            style={{ WebkitFontSmoothing: 'none', fontSmooth: 'never', textRendering: 'pixelated' }}
          >
            Vyre
          </h1>
        </div>

        {/* Loading Bar Container - Matte and subtle, increased spacing */}
        <div className="flex items-center gap-6 mb-10">
          <div className="w-48 sm:w-64 h-1.5 bg-[#121417] border border-[#272B31] overflow-hidden relative">
            <div 
              className="h-full bg-[#137A5F]" // Matte, desaturated fill
              style={{ width: `${progress}%` }} 
            />
          </div>
          <div 
            className="font-pixel text-[#137A5F] text-sm w-12 text-right tracking-[0.1em]" 
            style={{ WebkitFontSmoothing: 'none', fontSmooth: 'never', textRendering: 'pixelated' }}
          >
            {progress}%
          </div>
        </div>

        {/* Boot Messages */}
        <div className="h-6 relative w-72 flex justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={MESSAGES[msgIndex]}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute font-pixel text-[#5C6167] text-xs tracking-[0.3em] uppercase text-center"
              style={{ WebkitFontSmoothing: 'none', fontSmooth: 'never', textRendering: 'pixelated' }}
            >
              {MESSAGES[msgIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Singleton state to guarantee the loader survives React unmounts during route transitions
let globalRoot = null;
let container = null;
let activeMounts = 0;
let fadeOutTimeout = null;
let unmountTimeout = null;
let isCurrentlyFadingOut = false;

export default function PixelLoader() {
  useEffect(() => {
    activeMounts++;
    
    // If a new mount happens before we finish unmounting, cancel the destruction!
    // This perfectly bridges the gap between App.js unmounting and Dashboard.js remounting
    if (fadeOutTimeout) clearTimeout(fadeOutTimeout);
    if (unmountTimeout) clearTimeout(unmountTimeout);

    if (!container) {
      container = document.createElement('div');
      container.id = 'vyre-continuous-loader';
      document.body.appendChild(container);
      globalRoot = createRoot(container);
      isCurrentlyFadingOut = false;
    }
    
    if (globalRoot) {
      globalRoot.render(<ContinuousLoaderUI isFadingOut={isCurrentlyFadingOut} />);
    }

    return () => {
      activeMounts--;
      
      // Wait for 1 tick to see if another PixelLoader mounts (e.g. App to Dashboard transition)
      setTimeout(() => {
        if (activeMounts === 0 && globalRoot) {
          
          // Wait 150-200ms at 100% before fading out
          fadeOutTimeout = setTimeout(() => {
            isCurrentlyFadingOut = true;
            if (globalRoot) {
              globalRoot.render(<ContinuousLoaderUI isFadingOut={true} />);
            }
            
            // Fade takes 250ms. Wait 300ms to completely unmount the DOM.
            unmountTimeout = setTimeout(() => {
              if (globalRoot) {
                globalRoot.unmount();
                globalRoot = null;
                if (container && document.body.contains(container)) {
                  document.body.removeChild(container);
                  container = null;
                }
              }
            }, 300);
          }, 150);
        }
      }, 0);
    };
  }, []);

  // Render a completely empty placeholder to satisfy React, it takes no visual space.
  return <div style={{ display: 'none' }} />;
}
