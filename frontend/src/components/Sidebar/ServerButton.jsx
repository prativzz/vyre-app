export default function ServerButton({ server, isActive, onClick }) {
  const initial = server.name ? server.name[0].toUpperCase() : '?';

  return (
    <button
      onClick={onClick}
      className={`relative w-12 h-12 flex-shrink-0 rounded-[16px] flex items-center justify-center text-white font-bold text-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        isActive
          ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30'
          : 'bg-gray-700 hover:bg-gray-600'
      }`}
    >
      {initial}
    </button>
  );
}