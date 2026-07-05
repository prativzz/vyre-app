import { motion } from 'framer-motion';

export default function ServerButton({ server, isActive, onClick }) {
  const initial = server.name ? server.name[0].toUpperCase() : '?';

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative w-12 h-12 mb-3 flex-shrink-0 rounded-[12px] flex items-center justify-center font-pixel font-bold text-lg transition-all focus:outline-none overflow-hidden group border ${
        isActive
          ? 'bg-vyre-accent text-vyre-bg border-vyre-accent shadow-[0_0_12px_rgba(16,185,129,0.4)]'
          : 'bg-vyre-secondary text-vyre-text border-vyre-border hover:border-vyre-muted'
      }`}
    >
      <span className="relative z-10">{initial}</span>
      
      {/* Tiny pixel highlight on active */}
      {isActive && (
        <span className="absolute top-1 left-1 w-1 h-1 bg-white opacity-50 rounded-[1px]" />
      )}
    </motion.button>
  );
}