import { useState } from 'react';
import Modal from './Modal';
import AnimatedButton from '../ui/AnimatedButton';

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
      <h2 className="text-2xl font-bold font-pixel text-vyre-text mb-4">Create Server</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-pixel uppercase tracking-widest text-vyre-muted mb-2">Server Name</label>
          <input
            type="text"
            className="bg-vyre-bg text-vyre-text border border-vyre-border rounded-lg px-4 py-3 focus:border-vyre-accent outline-none w-full text-sm"
            placeholder="Enter server name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={maxLength}
            required
          />
          <p className="text-[10px] text-vyre-muted text-right mt-1 font-pixel">{name.length}/{maxLength}</p>
        </div>

        <div>
          <label className="block text-xs font-pixel uppercase tracking-widest text-vyre-muted mb-2">Description (optional)</label>
          <textarea
            className="bg-vyre-bg text-vyre-text border border-vyre-border rounded-lg px-4 py-3 focus:border-vyre-accent outline-none w-full text-sm resize-none"
            placeholder="What's this server about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="2"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-vyre-border mt-6">
          <AnimatedButton variant="ghost" onClick={onClose} className="px-4 py-2">
            Cancel
          </AnimatedButton>
          <AnimatedButton
            type="submit"
            variant="primary"
            className="px-6 py-2"
            disabled={!name.trim() || loading}
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-vyre-bg border-t-transparent rounded-full animate-spin mr-2"></span>
            ) : null}
            {loading ? 'Creating...' : 'Create'}
          </AnimatedButton>
        </div>
      </form>
    </Modal>
  );
}