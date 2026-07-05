import { motion } from 'framer-motion';

export default function BottomMenuButton({ icon: Icon, label, onClick, isActive }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-colors focus:outline-none overflow-hidden group border ${
        isActive 
          ? 'bg-vyre-accent text-vyre-bg border-vyre-accent shadow-[0_0_12px_rgba(16,185,129,0.4)]' 
          : 'bg-vyre-secondary text-vyre-muted border-vyre-border hover:bg-vyre-border hover:text-vyre-text'
      }`}
      aria-label={label}
    >
      <Icon size={20} className="relative z-10" />
      {isActive && (
        <span className="absolute top-1 left-1 w-1 h-1 bg-white opacity-50 rounded-[1px]" />
      )}
    </motion.button>
  );
}