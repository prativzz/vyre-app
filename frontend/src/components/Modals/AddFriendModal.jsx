import { API_URL } from '../../config';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from './Modal';
import AnimatedButton from '../ui/AnimatedButton';

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
      <h2 className="text-2xl font-bold font-pixel text-vyre-text mb-2">Add Friend</h2>
      <p className="text-xs text-vyre-muted mb-4 font-pixel tracking-widest uppercase">Search by username or display name.</p>

      {/* Search input – no icon */}
      <input
        ref={inputRef}
        type="text"
        className="bg-vyre-bg text-vyre-text border border-vyre-border rounded-lg px-4 py-3 focus:border-vyre-accent outline-none w-full text-sm"
        placeholder="Search for users..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        disabled={loading}
      />

      {/* Results list */}
      {searchQuery.trim() && (
        <div className="mt-3 max-h-48 overflow-y-auto space-y-1 bg-vyre-bg rounded-lg p-1 border border-vyre-border">
          {loading ? (
            <div className="text-center text-vyre-muted py-2 text-xs font-pixel uppercase tracking-widest">Loading users...</div>
          ) : results.length > 0 ? (
            results.map((user) => {
              const status = getStatus(user.id);
              return (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                    selectedUser?.id === user.id
                      ? 'bg-vyre-secondary border-vyre-accent border'
                      : 'hover:bg-vyre-secondary border-transparent border'
                  }`}
                  onClick={() => {
                    if (status) return; // can't select friend or pending
                    setSelectedUser(user);
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-[8px] bg-vyre-secondary flex items-center justify-center text-vyre-muted font-bold font-pixel text-xs border border-vyre-border">
                      {(user.display_name || user.username)[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-vyre-text">
                        {user.display_name || user.username}
                      </div>
                      <div className="text-[10px] text-vyre-muted font-pixel tracking-wider uppercase">@{user.username}</div>
                    </div>
                  </div>
                  {status === 'friend' && (
                    <span className="text-xs text-vyre-muted font-pixel uppercase">✓ Friend</span>
                  )}
                  {status === 'pending' && (
                    <span className="text-xs text-vyre-accent font-pixel uppercase">Pending</span>
                  )}
                  {!status && selectedUser?.id === user.id && (
                    <span className="text-vyre-accent text-sm font-pixel">✓ Selected</span>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center text-vyre-muted py-2 text-xs font-pixel uppercase tracking-widest">No users found</div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-vyre-border">
        <AnimatedButton variant="ghost" onClick={onClose} className="px-4 py-2">
          Cancel
        </AnimatedButton>
        <AnimatedButton
          variant="primary"
          onClick={handleSendRequest}
          className="px-4 py-2"
          disabled={!selectedUser || sending}
        >
          {sending ? (
            <span className="inline-block w-4 h-4 border-2 border-vyre-bg border-t-transparent rounded-full animate-spin mr-2"></span>
          ) : null}
          {sending ? 'Sending...' : 'Send Friend Request'}
        </AnimatedButton>
      </div>
    </Modal>
  );
}