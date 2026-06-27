import { API_URL } from '../config';
import { useState, useRef } from 'react';

export default function ProfileModal({ user, token, onClose, onUpdate }) {
  const [displayName, setDisplayName] = useState(user.display_name || user.username);
  const [status, setStatus] = useState(user.status || '');
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef();

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let avatarBase64 = avatarPreview;
    if (avatarFile) {
      // Convert to base64 (already done in preview)
      avatarBase64 = avatarPreview;
    }
    const res = await fetch(`${API_URL}/user/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        display_name: displayName,
        status: status,
        avatar: avatarBase64,
      }),
    });
    const data = await res.json();
    if (data.success) {
      onUpdate(data.user);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-card rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center">
            <div
              className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center cursor-pointer overflow-hidden mb-2 relative group shadow-lg"
              onClick={() => fileInputRef.current.click()}
            >
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-200 z-10">
                <span className="text-xs font-bold uppercase tracking-wider">Change</span>
              </div>
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover relative z-0" />
              ) : (
                <span className="text-3xl font-bold relative z-0">{user.username[0].toUpperCase()}</span>
              )}
            </div>
            {avatarPreview && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium"
              >
                Remove Avatar
              </button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Display Name</label>
            <input
              type="text"
              className="input-modern"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
            <input
              type="text"
              className="input-modern"
              placeholder="e.g., Gaming, Studying, AFK"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            />
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}