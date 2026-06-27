import { API_URL } from '../../config';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from './Modal';

export default function AddFriendModal({ isOpen, onClose, friends, pendingRequests, onRefresh }) {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sending, setSending] = useState(false);
  const inputRef = useRef();

  // Fetch all users when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          // Exclude deleted users
          const filtered = data.filter(u => 
            u.username !== 'Deleted User' && 
            u.display_name !== 'Deleted User'
          );
          setAllUsers(filtered);
        })
        .catch(err => console.error('Failed to fetch users:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, token]);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Filter users based on search query
  const results = allUsers.filter(u => {
    if (!searchQuery.trim()) return false;
    const query = searchQuery.toLowerCase();
    return (u.username?.toLowerCase().includes(query) || 
            u.display_name?.toLowerCase().includes(query));
  });

  // Check if user is already friend or pending
  const getStatus = (userId) => {
    if (friends.some(f => f.friend_id === userId)) return 'friend';
    if (pendingRequests.some(p => p.id === userId)) return 'pending';
    return null;
  };

  const handleSendRequest = async () => {
    if (!selectedUser) return;
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/friends/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ friendId: selectedUser.id })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Friend request sent to ${selectedUser.display_name || selectedUser.username}!`);
        onRefresh(); // refresh friends list
        onClose();
        setSelectedUser(null);
        setSearchQuery('');
      } else {
        alert(data.error || 'Failed to send request');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-2xl font-bold text-white mb-1">Add Friend</h2>
      <p className="text-sm text-gray-400 mb-4">Search by username or display name.</p>

      {/* Search input – no icon */}
      <input
        ref={inputRef}
        type="text"
        className="input-modern w-full"
        placeholder="Search for users..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        disabled={loading}
      />

      {/* Results list */}
      {searchQuery.trim() && (
        <div className="mt-3 max-h-48 overflow-y-auto space-y-1 bg-gray-700/30 rounded-lg p-1">
          {loading ? (
            <div className="text-center text-gray-400 py-2">Loading users...</div>
          ) : results.length > 0 ? (
            results.map((user) => {
              const status = getStatus(user.id);
              return (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                    selectedUser?.id === user.id
                      ? 'bg-blue-600/40 border border-blue-500'
                      : 'hover:bg-gray-700/60'
                  }`}
                  onClick={() => {
                    if (status) return; // can't select friend or pending
                    setSelectedUser(user);
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                      {(user.display_name || user.username)[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">
                        {user.display_name || user.username}
                      </div>
                      <div className="text-xs text-gray-400">@{user.username}</div>
                    </div>
                  </div>
                  {status === 'friend' && (
                    <span className="text-xs text-gray-400">✓ Friend</span>
                  )}
                  {status === 'pending' && (
                    <span className="text-xs text-yellow-400">Pending</span>
                  )}
                  {!status && selectedUser?.id === user.id && (
                    <span className="text-blue-400 text-sm">✓ Selected</span>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-400 py-2">No users found</div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3 mt-4 pt-2 border-t border-gray-700/50">
        <button onClick={onClose} className="btn-secondary">
          Cancel
        </button>
        <button
          onClick={handleSendRequest}
          className="btn-primary flex items-center space-x-2"
          disabled={!selectedUser || sending}
        >
          {sending ? (
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
          ) : null}
          {sending ? 'Sending...' : 'Send Friend Request'}
        </button>
      </div>
    </Modal>
  );
}