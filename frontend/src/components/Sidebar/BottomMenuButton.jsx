import { motion } from 'framer-motion';

export default function BottomMenuButton({ icon: Icon, label, onClick, isActive }) {
  return (
    <motion.button
      whileHover={{ scale: 1.15, y: -2 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`relative w-12 h-12 rounded-full flex items-center justify-center text-white focus:outline-none overflow-hidden group ${
        isActive 
          ? 'bg-blue-600/80 shadow-[0_4px_20px_rgba(37,99,235,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)]' 
          : 'bg-white/5 hover:bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
      }`}
      aria-label={label}
    >
      <Icon size={22} className="relative z-10" />
      {isActive && (
        <motion.div 
          layoutId="activeNav"
          className="absolute inset-0 bg-gradient-to-b from-blue-400/50 to-blue-600/80"
          initial={false}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      <span className="absolute inset-0 translate-y-[100%] group-hover:translate-y-[-100%] transition-transform duration-700 bg-gradient-to-t from-transparent via-white/10 to-transparent pointer-events-none" />
    </motion.button>
  );
}