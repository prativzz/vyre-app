import React, { useEffect, useRef } from 'react';

const COLORS = [
  { r: 16, g: 185, b: 129 }, // Emerald
  { r: 52, g: 211, b: 153 }, // Mint
  { r: 132, g: 204, b: 22 },  // Lime
  { r: 253, g: 224, b: 71 }, // Soft Yellow
  { r: 243, g: 243, b: 243 }  // Soft White
];

export default function HeroInteraction({ children }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const state = useRef({
    x: 0,
    y: 0,
    isHovering: false,
    hexes: [],
    width: 0,
    height: 0
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const generateGrid = (width, height) => {
      const R = 6;
      const drawR = 5;
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
          
          const path = new Path2D();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 180) * (60 * i - 30);
            const px = x + drawR * Math.cos(angle);
            const py = y + drawR * Math.sin(angle);
            if (i === 0) path.moveTo(px, py);
            else path.lineTo(px, py);
          }
          path.closePath();
          
          const color = COLORS[Math.floor(Math.random() * COLORS.length)];
          
          hexes.push({
            x, y,
            path,
            r: color.r,
            g: color.g,
            b: color.b,
            maxOpacity: 0.15 + Math.random() * 0.25, // 15% to 40%
            currentOpacity: 0
          });
        }
      }
      return hexes;
    };

    const resize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Handle high DPI displays for crisp rendering
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        state.current.width = rect.width;
        state.current.height = rect.height;
        
        // Regenerate grid only on resize to maintain performance
        state.current.hexes = generateGrid(rect.width, rect.height);
      }
    };
    
    window.addEventListener('resize', resize);
    resize();

    const render = () => {
      const s = state.current;
      ctx.clearRect(0, 0, s.width, s.height);

      const revealRadius = 140;
      const fadeInSpeed = 1 / 10;  // ~160ms at 60fps
      const fadeOutSpeed = 1 / 20; // ~330ms at 60fps

      for (let i = 0; i < s.hexes.length; i++) {
        const hex = s.hexes[i];
        let target = 0;
        
        if (s.isHovering) {
          const dx = s.x - hex.x;
          const dy = s.y - hex.y;
          const distSq = dx * dx + dy * dy;
          
          if (distSq < revealRadius * revealRadius) {
            const dist = Math.sqrt(distSq);
            // Smooth easing for intensity instead of linear dropoff
            const intensity = 1 - (dist / revealRadius);
            const easeIntensity = intensity * intensity; 
            target = hex.maxOpacity * easeIntensity;
          }
        }
        
        if (hex.currentOpacity < target) {
          hex.currentOpacity = Math.min(target, hex.currentOpacity + fadeInSpeed);
        } else if (hex.currentOpacity > target) {
          hex.currentOpacity = Math.max(target, hex.currentOpacity - fadeOutSpeed);
        }
        
        if (hex.currentOpacity > 0.01) {
          ctx.fillStyle = `rgba(${hex.r}, ${hex.g}, ${hex.b}, ${hex.currentOpacity.toFixed(3)})`;
          ctx.fill(hex.path);
        }
      }
      
      animationFrameId = requestAnimationFrame(render);
    };

    render();

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
