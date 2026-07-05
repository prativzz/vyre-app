import React, { useEffect, useRef } from 'react';

const getRandomColor = () => {
  const rand = Math.random();
  if (rand < 0.40) return '#20C997'; // Primary
  if (rand < 0.70) return '#16B388'; // Secondary
  if (rand < 0.85) return '#14866C'; // Dark Accent
  if (rand < 0.95) return 'rgba(32, 201, 151, 0.12)'; // Very dark cells
  return '#34D399'; // Highlight (sparingly)
};

export default function HeroInteraction({ children }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const state = useRef({
    x: 0,
    y: 0,
    isHovering: false,
    hexes: [],
    width: 0,
    height: 0,
    lastTime: performance.now()
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const hexPath = new Path2D();
    const drawR = 14; // Increased from 11 (approx 25% bigger)
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30);
      const px = drawR * Math.cos(angle);
      const py = drawR * Math.sin(angle);
      if (i === 0) hexPath.moveTo(px, py);
      else hexPath.lineTo(px, py);
    }
    hexPath.closePath();

    const generateGrid = (width, height) => {
      const R = 15.5; // Increased from 12 (approx 30% bigger). Spacing proportional.
      const W = Math.sqrt(3) * R;
      const xSpacing = W;
      const ySpacing = 1.5 * R;
      
      const cols = Math.ceil(width / xSpacing) + 2;
      const rows = Math.ceil(height / ySpacing) + 2;

      const hexes = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * xSpacing + (row % 2 === 1 ? xSpacing / 2 : 0);
          const y = row * ySpacing;
          
          hexes.push({
            x, y,
            color: getRandomColor(),
            // Drastically increase noise so only a sparse, random selection falls into the active radius
            noise: Math.random() * 80 - 40, 
            delayOut: Math.random() * 200, 
            fadeInSpeed: 1000 / 120, // 120ms fade in
            fadeSpeed: 1000 / (500 + Math.random() * 200),  // 500-700ms fade out
            opacity: 0,
            scale: 0.92, // 0.92 -> 1.0
            timeSinceInactive: 0
          });
        }
      }
      return hexes;
    };

    const resize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        state.current.width = rect.width;
        state.current.height = rect.height;
        state.current.hexes = generateGrid(rect.width, rect.height);
      }
    };
    
    window.addEventListener('resize', resize);
    resize();

    const render = (time) => {
      const s = state.current;
      const dt = Math.min((time - s.lastTime) / 1000, 0.1);
      s.lastTime = time;

      ctx.clearRect(0, 0, s.width, s.height);

      for (let i = 0; i < s.hexes.length; i++) {
        const hex = s.hexes[i];
        let isNearCursor = false;
        
        if (s.isHovering) {
          const dx = s.x - hex.x;
          const dy = s.y - hex.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // Using a strict distance threshold combined with the high random noise 
          // to dramatically reduce density (only ~10-15 hexes will trigger)
          if (dist + hex.noise < 45) {
            isNearCursor = true;
          }
        }
        
        if (isNearCursor) {
          hex.opacity = Math.min(1, hex.opacity + dt * hex.fadeInSpeed);
          hex.scale = Math.min(1, hex.scale + dt * (0.08 * hex.fadeInSpeed)); // 0.92 to 1.0 is 0.08 difference
          hex.timeSinceInactive = 0;
        } else {
          hex.timeSinceInactive += dt * 1000;
          if (hex.timeSinceInactive > hex.delayOut) {
            hex.opacity = Math.max(0, hex.opacity - dt * hex.fadeSpeed);
            hex.scale = Math.max(0.92, hex.scale - dt * (0.08 * hex.fadeSpeed));
          }
        }
        
        if (hex.opacity > 0.01) {
          ctx.save();
          ctx.translate(hex.x, hex.y);
          ctx.scale(hex.scale, hex.scale);
          ctx.globalAlpha = hex.opacity;
          ctx.fillStyle = hex.color;
          ctx.fill(hexPath);
          ctx.restore();
        }
      }
      
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    state.current.x = e.clientX - rect.left;
    state.current.y = e.clientY - rect.top;
  };

  const handleMouseEnter = () => {
    state.current.isHovering = true;
  };

  const handleMouseLeave = () => {
    state.current.isHovering = false;
  };

  return (
    <div 
      ref={containerRef}
      className="relative flex flex-1 w-full h-full"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0"
        style={{ width: '100%', height: '100%' }}
      />
      <div className="relative z-10 flex flex-1 items-center justify-center">
        {children}
      </div>
    </div>
  );
}
