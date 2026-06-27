import { API_URL } from '../config';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Modal from './Modals/Modal';

export default function SettingsModal({ isOpen, onClose }) {
  const { token, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

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
        setMessage({ type: 'success', text: 'Password updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to change password.' });
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
      <h2 className="text-2xl font-bold text-white mb-4">Settings</h2>
      {message.text && (
        <div className={`p-2 rounded mb-3 text-sm ${message.type === 'success' ? 'bg-green-600/30 text-green-200' : 'bg-red-600/30 text-red-200'}`}>
          {message.text}
        </div>
      )}
      <form onSubmit={handleChangePassword} className="space-y-3 mb-4">
        <h3 className="text-sm font-semibold text-gray-300">Change Password</h3>
        <input
          type="password"
          placeholder="Current password"
          className="input-modern w-full"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          disabled={loading}
        />
        <input
          type="password"
          placeholder="New password"
          className="input-modern w-full"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Confirm new password"
          className="input-modern w-full"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={loading}
        />
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>

      <button
        onClick={() => { logout(); onClose(); window.location.href = '/login'; }}
        className="btn-secondary w-full mb-3"
        disabled={loading}
      >
        Logout
      </button>

      <button
        onClick={handleDeleteAccount}
        className="w-full py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition"
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Delete Account'}
      </button>
    </Modal>
  );
}