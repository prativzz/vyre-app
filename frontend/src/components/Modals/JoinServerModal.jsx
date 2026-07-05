import { useState } from 'react';
import Modal from './Modal';
import AnimatedButton from '../ui/AnimatedButton';

export default function JoinServerModal({ isOpen, onClose, onJoin }) {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError('Please enter an invite code.');
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => {
      // Simulate join
      onJoin(inviteCode);
      setLoading(false);
      onClose();
    }, 1000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-2xl font-bold font-pixel text-vyre-text mb-4">Join Server</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-pixel uppercase tracking-widest text-vyre-muted mb-2">Invite Code</label>
          <input
            type="text"
            className="bg-vyre-bg text-vyre-text border border-vyre-border rounded-lg px-4 py-3 focus:border-vyre-accent outline-none w-full text-sm"
            placeholder="Enter invite code"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            required
          />
          {error && <p className="text-red-400 text-xs mt-2 font-pixel uppercase tracking-widest">{error}</p>}
        </div>
        <div className="flex justify-end space-x-3 pt-4 border-t border-vyre-border mt-6">
          <AnimatedButton variant="ghost" onClick={onClose} className="px-4 py-2">
            Cancel
          </AnimatedButton>
          <AnimatedButton
            type="submit"
            variant="primary"
            className="px-6 py-2"
            disabled={!inviteCode.trim() || loading}
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-vyre-bg border-t-transparent rounded-full animate-spin mr-2"></span>
            ) : null}
            {loading ? 'Joining...' : 'Join'}
          </AnimatedButton>
        </div>
      </form>
    </Modal>
  );
}