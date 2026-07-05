import React, { useEffect, useRef } from 'react';

const getRandomColor = () => {
  const rand = Math.random();
  if (rand < 0.60) return '#22C55E'; // Emerald Green
  if (rand < 0.75) return '#34D399';
  if (rand < 0.90) return '#16A34A';
  return '#4ADE80';
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

    // Create standard hexagon path centered at 0,0
    const hexPath = new Path2D();
    const drawR = 11; // 1px gap from R=12 for the honeycomb look
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30);
      const px = drawR * Math.cos(angle);
      const py = drawR * Math.sin(angle);
      if (i === 0) hexPath.moveTo(px, py);
      else hexPath.lineTo(px, py);
    }
    hexPath.closePath();

    const generateGrid = (width, height) => {
      const R = 12; // 12px radius -> roughly 24px wide hex (user asked for larger 10-14px)
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
            noise: Math.random() * 30 - 15, // Non-symmetrical noise
            delayOut: Math.random() * 200,  // 0-200ms delay before fade out
            fadeInSpeed: 1000 / (120 + Math.random() * 60), // 120-180ms fade in
            fadeSpeed: 1000 / (400 + Math.random() * 300),  // 400-700ms fade out
            opacity: 0,
            scale: 0.9,
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
      const dt = Math.min((time - s.lastTime) / 1000, 0.1); // Cap dt at 100ms to prevent huge jumps
      s.lastTime = time;

      ctx.clearRect(0, 0, s.width, s.height);

      for (let i = 0; i < s.hexes.length; i++) {
        const hex = s.hexes[i];
        let isNearCursor = false;
        
        if (s.isHovering) {
          const dx = s.x - hex.x;
          const dy = s.y - hex.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // Effective distance incorporates noise so the cluster isn't perfectly round
          if (dist + hex.noise < 55) {
            isNearCursor = true;
          }
        }
        
        if (isNearCursor) {
          hex.opacity = Math.min(1, hex.opacity + dt * hex.fadeInSpeed);
          hex.scale = Math.min(1, hex.scale + dt * (0.1 * hex.fadeInSpeed));
          hex.timeSinceInactive = 0;
        } else {
          hex.timeSinceInactive += dt * 1000;
          if (hex.timeSinceInactive > hex.delayOut) {
            hex.opacity = Math.max(0, hex.opacity - dt * hex.fadeSpeed);
            hex.scale = Math.max(0.9, hex.scale - dt * (0.1 * hex.fadeSpeed));
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
