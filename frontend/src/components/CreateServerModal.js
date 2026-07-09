import { useState } from 'react';
import PixelPanel from './ui/PixelPanel';

const TEMPLATES = [
  { id: 'gaming', name: '🎮 Gaming', desc: 'LFG, game news, voice channels' },
  { id: 'news', name: '📰 News', desc: 'World news, discussion, livestream' },
  { id: 'study', name: '📚 Study', desc: 'Homework help, resources, silent study' },
  { id: 'random', name: '🌀 Random', desc: '4chan‑style: random, spam, off‑topic' },
  { id: 'general', name: '✨ General', desc: 'Classic Discord setup' },
];

export default function CreateServerModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;
    setIsSubmitting(true);
    await onCreate(name, selectedTemplate);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-lg animate-fade-in">
        <PixelPanel className="p-6 flex flex-col">
          <h2 className="text-2xl font-bold font-pixel text-vyre-accent uppercase tracking-widest mb-6">Create a Server</h2>
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            <input
              type="text"
              placeholder="Server name"
              className="input-minimal w-full"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              required
            />
            <div>
              <label className="block font-pixel text-[10px] text-vyre-muted uppercase tracking-widest mb-3">Choose a topic template</label>
              <div className="grid grid-cols-1 gap-2 mb-2 max-h-64 overflow-y-auto friends-scrollbar pr-2">
                {TEMPLATES.map(t => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors duration-200 ${
                      selectedTemplate === t.id
                        ? 'bg-vyre-secondary border-vyre-accent'
                        : 'bg-vyre-card border-vyre-border hover:border-vyre-muted hover:bg-vyre-secondary'
                    }`}
                  >
                    <div className="font-semibold text-vyre-text mb-1">{t.name}</div>
                    <div className="text-xs text-vyre-muted font-pixel tracking-wider uppercase text-[9px]">{t.desc}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4 border-t border-vyre-border pt-6">
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