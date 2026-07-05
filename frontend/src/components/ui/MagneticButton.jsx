import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export default function MagneticButton({
  children,
  className,
  onClick,
  disabled = false,
  variant = 'primary', // 'primary', 'secondary', 'ghost', 'danger'
  ...props
}) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e) => {
    if (disabled || !ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.2, y: middleY * 0.2 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  const variants = {
    primary: "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-[0_4px_20px_rgba(59,130,246,0.3)] hover:shadow-[0_8px_30px_rgba(59,130,246,0.4)] border border-blue-400/30",
    secondary: "bg-gray-800/80 text-white border border-gray-600/50 hover:bg-gray-700/80 shadow-lg",
    ghost: "bg-transparent text-gray-300 hover:text-white hover:bg-white/10",
    danger: "bg-gradient-to-b from-red-500 to-red-600 text-white shadow-[0_4px_20px_rgba(239,68,68,0.3)] border border-red-400/30"
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative rounded-xl px-4 py-2 font-medium transition-colors overflow-hidden group",
        variants[variant],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      {...props}
    >
      {/* Subtle shine effect on hover */}
      {!disabled && (
        <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-b from-white to-transparent pointer-events-none" />
      )}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
