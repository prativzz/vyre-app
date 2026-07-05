import React, { useEffect, useRef } from 'react';

const COLORS = ['#10B981', '#34D399', '#84CC16', '#F3F3F3', '#FDE047'];

export default function HeroInteraction({ children }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Mutable state for the animation loop
  const state = useRef({
    x: 0,
    y: 0,
    lastX: 0,
    lastY: 0,
    isHovering: false,
    particles: [],
    width: 0,
    height: 0
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        state.current.width = rect.width;
        state.current.height = rect.height;
      }
    };
    
    window.addEventListener('resize', resize);
    resize();

    const render = () => {
      const s = state.current;
      
      ctx.clearRect(0, 0, s.width, s.height);

      // Calculate mouse speed
      const dx = s.x - s.lastX;
      const dy = s.y - s.lastY;
      const speed = Math.hypot(dx, dy);

      // Spawn particles if moving and hovering
      if (s.isHovering && speed > 0.5 && s.particles.length < 12) {
        // Chance to spawn based on speed, but keep it minimal
        if (Math.random() < 0.3) {
          s.particles.push({
            x: s.x + (Math.random() - 0.5) * 40,
            y: s.y + (Math.random() - 0.5) * 40,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            size: Math.random() > 0.8 ? (Math.random() > 0.5 ? 4 : 3) : 2,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            opacity: Math.random() * 0.5 + 0.2, // 20% to 70%
            life: 1.0 // 1.0 down to 0
          });
        }
      }

      // Update and draw particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.015; // fade out speed

        if (p.life <= 0) {
          s.particles.splice(i, 1);
          continue;
        }

        const currentOpacity = p.opacity * p.life;
        
        ctx.fillStyle = p.color;
        ctx.globalAlpha = currentOpacity;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      }

      ctx.globalAlpha = 1.0;
      
      s.lastX = s.x;
      s.lastY = s.y;
      
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
      />
      <div className="relative z-10 flex flex-1 items-center justify-center">
        {children}
      </div>
    </div>
  );
}
