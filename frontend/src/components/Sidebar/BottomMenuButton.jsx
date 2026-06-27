export default function BottomMenuButton({ icon: Icon, label, onClick, isActive }) {
  return (
    <button
      onClick={onClick}
      className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-700 hover:bg-gray-600'
      }`}
      aria-label={label}
    >
      <Icon size={24} />
    </button>
  );
}