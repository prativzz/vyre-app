import { API_URL } from '../config';
import { useState, useRef } from 'react';
import Modal from './Modals/Modal';
import AnimatedButton from './ui/AnimatedButton';

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
    <Modal isOpen={true} onClose={onClose}>
      <h2 className="text-2xl font-bold mb-4 font-pixel text-vyre-text">Edit Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col items-center mb-6">
          <div
            className="w-24 h-24 rounded-[20px] bg-vyre-secondary flex items-center justify-center cursor-pointer overflow-hidden mb-3 relative group shadow-lg border border-vyre-border transition-colors hover:border-vyre-accent text-vyre-muted font-pixel"
            onClick={() => fileInputRef.current.click()}
          >
            <div className="absolute inset-0 bg-vyre-card/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-vyre-text transition-opacity duration-200 z-10 backdrop-blur-sm">
              <span className="text-[10px] font-bold uppercase tracking-widest">Change</span>
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
              className="text-xs text-red-400 hover:text-red-300 transition-colors font-pixel uppercase tracking-widest"
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
          <label className="block text-xs font-pixel uppercase tracking-widest text-vyre-muted mb-2">Display Name</label>
          <input
            type="text"
            className="bg-vyre-bg text-vyre-text border border-vyre-border rounded-lg px-4 py-3 focus:border-vyre-accent outline-none w-full text-sm"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-pixel uppercase tracking-widest text-vyre-muted mb-2">Status</label>
          <input
            type="text"
            className="bg-vyre-bg text-vyre-text border border-vyre-border rounded-lg px-4 py-3 focus:border-vyre-accent outline-none w-full text-sm"
            placeholder="e.g., Gaming, Studying, AFK"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />
        </div>
        <div className="flex justify-end space-x-3 pt-4 border-t border-vyre-border mt-6">
          <AnimatedButton variant="ghost" onClick={onClose} className="px-4 py-2">
            Cancel
          </AnimatedButton>
          <AnimatedButton type="submit" variant="primary" className="px-6 py-2">
            Save
          </AnimatedButton>
        </div>
      </form>
    </Modal>
  );
}