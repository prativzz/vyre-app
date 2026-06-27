import { useState } from 'react';

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name, selectedTemplate);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-card rounded-2xl p-6 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">Create a Server</h2>
        <form onSubmit={handleSubmit} className="w-full">
          <input
            type="text"
            placeholder="Server name"
            className="input-modern w-full mb-4"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
            required
          />
          <label className="block text-sm font-medium text-gray-300 mb-2">Choose a topic template</label>
          <div className="grid grid-cols-1 gap-2 mb-6 max-h-64 overflow-y-auto">
            {TEMPLATES.map(t => (
              <div
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                className={`p-3 rounded-lg cursor-pointer transition ${
                  selectedTemplate === t.id
                    ? 'bg-blue-600/40 border border-blue-500'
                    : 'bg-gray-800/40 hover:bg-gray-700/60'
                }`}
              >
                <div className="font-semibold">{t.name}</div>
                <div className="text-xs text-gray-400">{t.desc}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}