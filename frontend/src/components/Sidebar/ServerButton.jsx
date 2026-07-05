import { motion } from 'framer-motion';

export default function ServerButton({ server, isActive, onClick }) {
  const initial = server.name ? server.name[0].toUpperCase() : '?';

  return (
    <motion.button
      whileHover={{ scale: 1.15, rotate: 2 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`relative w-12 h-12 mb-3 flex-shrink-0 rounded-[18px] flex items-center justify-center text-white font-bold text-lg transition-colors focus:outline-none overflow-hidden group ${
        isActive
          ? 'bg-blue-600 shadow-[0_4px_20px_rgba(37,99,235,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)]'
          : 'bg-white/5 hover:bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
      }`}
    >
      <span className="relative z-10">{initial}</span>
      
      {/* Liquid morph animation on active */}
      {isActive && (
        <motion.div 
          layoutId="activeServer"
          className="absolute inset-0 bg-gradient-to-tr from-blue-400 to-indigo-500 opacity-80"
          initial={false}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      
      {/* Sweeping chrome reflection on hover */}
      <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent z-20 pointer-events-none" />
    </motion.button>
  );
}