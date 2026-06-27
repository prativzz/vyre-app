import { useState } from 'react';

export default function CreateChannelModal({ onClose, onCreate, type }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="glass-card rounded-2xl p-6 w-96 max-w-[90vw]">
        <h3 className="text-xl font-bold text-white mb-4">Create {type} Channel</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Channel name"
            className="input-modern w-full p-3 rounded-lg mb-4"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition shadow-md"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}