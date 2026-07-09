import { useState } from 'react';
import PixelPanel from './ui/PixelPanel';

export default function CreateChannelModal({ onClose, onCreate, type }) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;
    setIsSubmitting(true);
    await onCreate(name);
    // Modal usually unmounts after onCreate succeeds, but in case it fails:
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <PixelPanel className="p-6 flex flex-col">
          <h3 className="text-xl font-bold font-pixel text-vyre-accent uppercase tracking-widest mb-6">Create {type} Channel</h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Channel name"
              className="input-minimal w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="btn-secondary font-pixel text-[10px] uppercase tracking-wider py-2 px-4 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary font-pixel text-[10px] uppercase tracking-wider py-2 px-4 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </PixelPanel>
      </div>
    </div>
  );
}