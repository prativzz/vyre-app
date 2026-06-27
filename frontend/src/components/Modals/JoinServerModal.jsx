import { useState } from 'react';
import Modal from './Modal';

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
      <h2 className="text-2xl font-bold text-white mb-4">Join Server</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Invite Code</label>
          <input
            type="text"
            className="input-modern w-full"
            placeholder="Enter invite code"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            required
          />
          {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
        </div>
        <div className="flex justify-end space-x-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center space-x-2"
            disabled={!inviteCode.trim() || loading}
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
            ) : null}
            {loading ? 'Joining...' : 'Join'}
          </button>
        </div>
      </form>
    </Modal>
  );
}