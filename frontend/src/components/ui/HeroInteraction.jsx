import React, { useEffect, useRef, useMemo } from 'react';

const getRandomColor = () => {
  const rand = Math.random();
  if (rand < 0.40) return '#20C997'; // Primary
  if (rand < 0.70) return '#16B388'; // Secondary
  if (rand < 0.85) return '#14866C'; // Dark Accent
  if (rand < 0.95) return 'rgba(32, 201, 151, 0.12)'; // Very dark cells
  return '#34D399'; // Highlight (sparingly)
};

export default function HeroInteraction({ children }) {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const clusterRef = useRef(null);

  const target = useRef({ x: -1000, y: -1000, active: false });
  const current = useRef({ x: -1000, y: -1000, opacity: 0 });
  const contentBox = useRef(null);

  // Generate the static hex polygon points
  const hexPoints = useMemo(() => {
    const drawR = 14; 
    return Array.from({ length: 6 }).map((_, i) => {
      const angle = (Math.PI / 180) * (60 * i - 30);
      return `${drawR * Math.cos(angle)},${drawR * Math.sin(angle)}`;
    }).join(' ');
  }, []);

  // Generate the single cluster of hexagons ONCE to ensure zero duplicate nodes
  const hexes = useMemo(() => {
    const R = 15.5; 
    const W = Math.sqrt(3) * R;
    const xSpacing = W;
    const ySpacing = 1.5 * R;
    
    const generated = [];
    for (let row = -6; row <= 6; row++) {
      for (let col = -6; col <= 6; col++) {
        const x = col * xSpacing + (row % 2 === 1 ? xSpacing / 2 : 0);
        const y = row * ySpacing;
        
        const dist = Math.sqrt(x*x + y*y);
        const noise = Math.random() * 40 - 20;
        
        if (dist + noise < 55) { // Strict radius
          generated.push({
            x, y,
            color: getRandomColor(),
            opacity: 0.4 + Math.random() * 0.3, // Matches original exact opacity
            scale: 0.95
          });
        }
      }
    }
    return generated;
  }, []);

  useEffect(() => {
    const updateContentBox = () => {
      if (containerRef.current && contentRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const textRect = contentRef.current.getBoundingClientRect();
        contentBox.current = {
          left: textRect.left - rect.left - 20,
          right: textRect.right - rect.left + 20,
          top: textRect.top - rect.top - 20,
          bottom: textRect.bottom - rect.top + 20,
        };
      }
    };

    window.addEventListener('resize', updateContentBox);
    setTimeout(updateContentBox, 100);

    let animationFrameId;
    const render = () => {
      // Critically damped spring-like lerp. 
      // 35% distance covered per frame (~120-180ms visual duration)
      // Perfectly smooth, zero overshoot, zero lagging individual hexes.
      const lerp = 0.35; 
      
      current.current.x += (target.current.x - current.current.x) * lerp;
      current.current.y += (target.current.y - current.current.y) * lerp;
      
      let isBehindText = false;
      if (contentBox.current) {
        const { left, right, top, bottom } = contentBox.current;
        const cx = current.current.x;
        const cy = current.current.y;
        if (cx > left && cx < right && cy > top && cy < bottom) {
          isBehindText = true;
        }
      }
      
      // If hovering the text, dim the entire cluster to 15% to prevent washing out the logo
      const finalTargetOpacity = target.current.active ? (isBehindText ? 0.15 : 1) : 0;
      
      // Opacity lerp (slightly slower for a relaxed fade)
      current.current.opacity += (finalTargetOpacity - current.current.opacity) * 0.15;
      
      if (clusterRef.current) {
        // 100% GPU accelerated transform. Prioritizes the latest coordinates immediately.
        clusterRef.current.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0)`;
        clusterRef.current.style.opacity = current.current.opacity;
      }
      
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', updateContentBox);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Snap immediately on first hover to prevent flying in from off-screen
    if (current.current.x === -1000) {
      current.current.x = x;
      current.current.y = y;
    }
    
    // Always prioritize the latest cursor position (skip intermediate mouse events)
    target.current.x = x;
    target.current.y = y;
    target.current.active = true;
  };

  const handleMouseLeave = () => {
    target.current.active = false;
  };

  return (
    <div 
      ref={containerRef}
      className="relative flex flex-1 w-full h-full overflow-hidden bg-vyre-bg"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => { target.current.active = true; }}
      onMouseLeave={handleMouseLeave}
    >
      {/* The Single Moving Cluster Instance */}
      <div 
        ref={clusterRef}
        className="pointer-events-none absolute left-0 top-0 will-change-transform z-0"
        style={{ width: 0, height: 0, opacity: 0 }}
      >
        {hexes.map((hex, i) => (
          <svg 
            key={i} 
            className="absolute overflow-visible" 
            style={{ 
              transform: `translate3d(${hex.x}px, ${hex.y}px, 0) scale(${hex.scale})`,
              opacity: hex.opacity,
              left: 0, top: 0
            }}
          >
            <polygon points={hexPoints} fill={hex.color} />
          </svg>
        ))}
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center w-full h-full">
        <div ref={contentRef} className="pointer-events-none">
          <div className="pointer-events-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
