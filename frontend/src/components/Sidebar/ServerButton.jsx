import { motion } from 'framer-motion';

export default function ServerButton({ server, isActive, onClick }) {
  const initial = server.name ? server.name[0].toUpperCase() : '?';

  return (
    <div className="relative flex items-center justify-center w-full group">
      {/* Side Pill Indicator */}
      <div className="absolute left-0 flex items-center h-full">
        <div 
          className={`w-1 bg-vyre-text rounded-r-md transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isActive 
              ? "h-10 opacity-100 scale-100" 
              : "h-2 opacity-0 scale-0 group-hover:h-5 group-hover:opacity-100 group-hover:scale-100"
          }`}
        />
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`relative w-12 h-12 flex-shrink-0 flex items-center justify-center font-pixel font-bold text-lg transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none overflow-hidden border ${
          isActive
            ? 'rounded-[12px] bg-vyre-accent text-vyre-bg border-vyre-accent shadow-[0_0_12px_rgba(16,185,129,0.4)]'
            : 'rounded-[24px] bg-vyre-secondary text-vyre-text border-vyre-border hover:rounded-[12px] hover:bg-vyre-accent hover:text-vyre-bg hover:border-vyre-accent'
        }`}
      >
        <span className="relative z-10">{initial}</span>
        
        {/* Tiny pixel highlight on active */}
        {isActive && (
          <span className="absolute top-1 left-1 w-1 h-1 bg-white opacity-50 rounded-[1px]" />
        )}
      </motion.button>
    </div>
  );
}