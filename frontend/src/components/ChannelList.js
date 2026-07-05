import { API_URL } from '../config';
import { useState } from 'react';
import CreateChannelModal from './CreateChannelModal';
import PixelPanel from './ui/PixelPanel';

export default function ChannelList({
  channels,
  selectedChannel,
  onSelectChannel,
  serverName,
  inviteCode,
  serverId,
  serverOwnerId,
  currentUserId,
  token,
  fetchChannels,
  onServerDeleted
}) {
  const [editingChannel, setEditingChannel] = useState(null);
  const [loading, setLoading] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [channelType, setChannelType] = useState('text');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const copyInvite = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode)
      .then(() => alert('Invite code copied!'))
      .catch(() => alert('Failed to copy. Please copy manually: ' + inviteCode));
  };

  const openCreateModal = (type) => {
    setChannelType(type);
    setShowCreateModal(true);
  };

  const handleCreate = async (name) => {
    try {
      const res = await fetch(`${API_URL}/channels/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ serverId, name, type: channelType })
      });
      const data = await res.json();
      if (res.ok) {
        await fetchChannels(serverId);
        setShowCreateModal(false);
      } else {
        alert(data.error || 'Failed to create channel');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
  };

  const handleRename = async (channelId, newName) => {
    if (!newName) return;
    try {
      setLoading(prev => ({ ...prev, [channelId]: true }));
      const res = await fetch(`${API_URL}/channels/${channelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newName })
      });
      const data = await res.json();
      if (res.ok) {
        await fetchChannels(serverId);
        setEditingChannel(null);
      } else {
        alert(data.error || 'Failed to rename');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setLoading(prev => ({ ...prev, [channelId]: false }));
    }
  };

  const confirmDelete = (channelId) => setShowDeleteConfirm(channelId);

  const handleDelete = async () => {
    const channelId = showDeleteConfirm;
    if (!channelId) return;
    try {
      setLoading(prev => ({ ...prev, [channelId]: true }));
      const res = await fetch(`${API_URL}/channels/${channelId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        if (selectedChannel?.id === channelId) onSelectChannel(null);
        await fetchChannels(serverId);
      } else {
        alert(data.error || 'Failed to delete channel');
        if (res.status === 404) await fetchChannels(serverId);
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Network error – please refresh.');
    } finally {
      setLoading(prev => ({ ...prev, [channelId]: false }));
      setShowDeleteConfirm(null);
    }
  };

  const handleDeleteServer = async () => {
    if (!window.confirm(`Are you absolutely sure you want to delete ${serverName || 'this server'}? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_URL}/servers/${serverId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        onServerDeleted();
      } else {
        alert(data.error || 'Failed to delete server');
      }
    } catch (err) {
      console.error('Server delete error:', err);
      alert('Network error - please try again later.');
    }
  };

  const renderChannel = (ch) => {
    const isEditing = editingChannel?.id === ch.id;
    const isLoading = loading[ch.id];

    return (
      <div
        key={ch.id}
        className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition group ${
          selectedChannel?.id === ch.id
            ? 'bg-vyre-secondary text-vyre-text font-medium'
            : 'text-vyre-muted hover:bg-vyre-secondary hover:text-vyre-text'
        }`}
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0" onClick={() => onSelectChannel(ch)}>
          <span className="text-vyre-muted font-pixel text-xs">{ch.type === 'text' ? '#' : '🔊'}</span>
          {isEditing ? (
            <input
              type="text"
              defaultValue={ch.name}
              autoFocus
              className="bg-vyre-bg text-vyre-text rounded border border-vyre-border px-1 w-full text-sm outline-none focus:border-vyre-accent"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename(ch.id, e.target.value);
                if (e.key === 'Escape') setEditingChannel(null);
              }}
              onBlur={(e) => handleRename(ch.id, e.target.value)}
              disabled={isLoading}
            />
          ) : (
            <span className="text-sm truncate">{ch.name}</span>
          )}
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition">
          {!isEditing && (
            <button onClick={(e) => { e.stopPropagation(); setEditingChannel({ id: ch.id, name: ch.name }); }} className="text-vyre-muted hover:text-vyre-text text-xs" disabled={isLoading}>✏️</button>
          )}
          <button onClick={(e) => { e.stopPropagation(); confirmDelete(ch.id); }} className="text-vyre-muted hover:text-red-400 text-xs" disabled={isLoading}>{isLoading ? '⏳' : '❌'}</button>
        </div>
      </div>
    );
  };

  const textChannels = channels.filter(c => c.type === 'text');
  const voiceChannels = channels.filter(c => c.type === 'voice');

  return (
    <PixelPanel className="w-64 flex-shrink-0 p-3 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 px-2 flex-shrink-0">
        <span className="text-sm font-bold text-vyre-text truncate mr-2 font-pixel">{serverName || 'Server'}</span>
        <div className="flex items-center space-x-2">
          {currentUserId === serverOwnerId && (
            <button onClick={handleDeleteServer} className="text-xs text-red-400 hover:text-red-300 transition" title="Delete Server">🗑️</button>
          )}
          {inviteCode && (
            <button onClick={copyInvite} className="text-xs text-vyre-muted hover:text-vyre-text transition" title="Copy invite code">📋</button>
          )}
        </div>
      </div>

      <div className="mb-4 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-2 mb-2">
          <h3 className="text-[10px] font-pixel text-vyre-muted uppercase tracking-widest">Text channels</h3>
          <button onClick={() => openCreateModal('text')} className="text-vyre-muted hover:text-vyre-accent text-lg leading-none" title="Create text channel">+</button>
        </div>
        <div className="mt-1 space-y-1">
          {textChannels.map(renderChannel)}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-2 mb-2">
          <h3 className="text-[10px] font-pixel text-vyre-muted uppercase tracking-widest">Voice channels</h3>
          <button onClick={() => openCreateModal('voice')} className="text-vyre-muted hover:text-vyre-accent text-lg leading-none" title="Create voice channel">+</button>
        </div>
        <div className="mt-1 space-y-1">
          {voiceChannels.map(renderChannel)}
        </div>
      </div>

      {showCreateModal && (
        <CreateChannelModal onClose={() => setShowCreateModal(false)} onCreate={handleCreate} type={channelType} />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <PixelPanel className="p-6 w-96 max-w-[90vw]">
            <h3 className="text-xl font-bold text-vyre-text mb-4 font-pixel">Delete Channel</h3>
            <p className="text-vyre-muted mb-6">Are you sure you want to delete this channel?</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 rounded-lg bg-vyre-secondary hover:bg-vyre-border text-vyre-text transition text-sm">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-semibold transition text-sm">Delete</button>
            </div>
          </PixelPanel>
        </div>
      )}
    </PixelPanel>
  );
}