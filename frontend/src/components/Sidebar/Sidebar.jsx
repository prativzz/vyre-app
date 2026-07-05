import { useState } from 'react';
import ServerSection from './ServerSection';
import BottomMenu from './BottomMenu';
import Divider from './Divider';
import AddFriendModal from '../Modals/AddFriendModal';
import CreateServerModal from '../Modals/CreateServerModal';
import JoinServerModal from '../Modals/JoinServerModal';
import SettingsModal from '../SettingsModal';   // <-- correct import

export default function Sidebar({
  servers,
  selectedServerId,
  onSelectServer,
  onCreateServer: originalCreateServer,
  onJoinServer: originalJoinServer,
  token,
  friends,
  pendingRequests,
  onRefresh,
}) {
  const [activeNav, setActiveNav] = useState('home');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showCreateServer, setShowCreateServer] = useState(false);
  const [showJoinServer, setShowJoinServer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleNavigate = (id) => {
    setActiveNav(id);
    if (id === 'home') {
      onSelectServer(null);
    } else if (id === 'settings') {
      setShowSettings(true);
    }
  };

  const handleCreateServer = (name, template) => {
    originalCreateServer(name, template);
    setShowCreateServer(false);
  };

  const handleJoinServer = (inviteCode) => {
    originalJoinServer(inviteCode);
    setShowJoinServer(false);
  };

  return (
    <div className="w-20 h-[calc(100%-2rem)] my-4 ml-4 bg-gray-900/40 backdrop-blur-xl rounded-3xl flex flex-col items-center border border-white/10 overflow-hidden flex-shrink-0 shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] relative z-40">
      <BottomMenu
        activeNav={activeNav}
        onNavigate={handleNavigate}
        onAddFriend={() => setShowAddFriend(true)}
        onCreateServer={() => setShowCreateServer(true)}
        onJoinServer={() => setShowJoinServer(true)}
      />

      <Divider />

      <ServerSection
        servers={servers}
        selectedServerId={selectedServerId}
        onSelectServer={onSelectServer}
      />

      <AddFriendModal
        isOpen={showAddFriend}
        onClose={() => setShowAddFriend(false)}
        friends={friends}
        pendingRequests={pendingRequests}
        onRefresh={onRefresh}
      />
      <CreateServerModal
        isOpen={showCreateServer}
        onClose={() => setShowCreateServer(false)}
        onCreate={handleCreateServer}
      />
      <JoinServerModal
        isOpen={showJoinServer}
        onClose={() => setShowJoinServer(false)}
        onJoin={handleJoinServer}
      />
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}