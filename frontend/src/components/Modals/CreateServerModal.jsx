import { useState } from 'react';
import Modal from './Modal';

export default function CreateServerModal({ isOpen, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setTimeout(() => {
      onCreate(name, 'general');
      setLoading(false);
      onClose();
    }, 1000);
  };

  const maxLength = 100;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-2xl font-bold text-white mb-4">Create Server</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Server Name</label>
          <input
            type="text"
            className="input-modern w-full"
            placeholder="Enter server name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={maxLength}
            required
          />
          <p className="text-xs text-gray-400 text-right mt-1">{name.length}/{maxLength}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Description (optional)</label>
          <textarea
            className="input-modern w-full"
            placeholder="What's this server about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="2"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center space-x-2"
            disabled={!name.trim() || loading}
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
            ) : null}
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}