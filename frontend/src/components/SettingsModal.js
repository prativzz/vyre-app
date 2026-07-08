import { API_URL } from '../config';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Modal from './Modals/Modal';
import AnimatedButton from './ui/AnimatedButton';

export default function SettingsModal({ isOpen, onClose }) {
  const { token, logout, user } = useAuth();
  const [hasPassword, setHasPassword] = useState(user?.hasPassword);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    setHasPassword(user?.hasPassword);
  }, [user?.hasPassword]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch(`${API_URL}/user/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: hasPassword ? 'Password updated successfully!' : 'Password set successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setHasPassword(true);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update password.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action is permanent.')) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/user`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        logout();
        window.location.href = '/login';
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete account.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold font-pixel text-vyre-text">Settings</h2>
      </div>

      {message.text && (
        <div className={`p-3 rounded-lg mb-4 text-xs font-pixel uppercase tracking-widest border ${message.type === 'success' ? 'bg-vyre-accent/10 text-vyre-accent border-vyre-accent/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleChangePassword} className="space-y-4 mb-8">
        <div>
          <h3 className="text-xs font-pixel uppercase tracking-widest text-vyre-muted mb-3 pb-2 border-b border-vyre-border">
            {hasPassword ? 'Change Password' : 'Set Password'}
          </h3>
          <div className="space-y-3">
            {hasPassword && (
              <input
                type="password"
                placeholder="Current password"
                className="bg-vyre-bg text-vyre-text border border-vyre-border rounded-lg px-4 py-3 focus:border-vyre-accent outline-none w-full text-sm"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={loading}
              />
            )}
            <input
              type="password"
              placeholder={hasPassword ? "New password" : "Enter password"}
              className="bg-vyre-bg text-vyre-text border border-vyre-border rounded-lg px-4 py-3 focus:border-vyre-accent outline-none w-full text-sm"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={loading}
            />
            <input
              type="password"
              placeholder={hasPassword ? "Confirm new password" : "Confirm password"}
              className="bg-vyre-bg text-vyre-text border border-vyre-border rounded-lg px-4 py-3 focus:border-vyre-accent outline-none w-full text-sm"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>
        <AnimatedButton type="submit" variant="primary" className="w-full py-3" disabled={loading}>
          {loading ? 'Processing...' : (hasPassword ? 'Update Password' : 'Set Password')}
        </AnimatedButton>
      </form>

      <div className="space-y-3 pt-4 border-t border-vyre-border">
        <h3 className="text-xs font-pixel uppercase tracking-widest text-vyre-muted mb-3">Account Actions</h3>
        <AnimatedButton
          onClick={() => { logout(); onClose(); window.location.href = '/login'; }}
          variant="secondary"
          className="w-full py-3"
          disabled={loading}
        >
          Logout
        </AnimatedButton>
        <AnimatedButton
          onClick={handleDeleteAccount}
          variant="danger"
          className="w-full py-3"
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Delete Account'}
        </AnimatedButton>
      </div>
    </Modal>
  );
}