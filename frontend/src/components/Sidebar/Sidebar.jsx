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
  onHome,
}) {
  const [activeNav, setActiveNav] = useState('home');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showCreateServer, setShowCreateServer] = useState(false);
  const [showJoinServer, setShowJoinServer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleNavigate = (id) => {
    setActiveNav(id);
    if (id === 'home') {
      if (onHome) onHome();
      else onSelectServer(null);
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
    <div className="w-20 h-full bg-vyre-card lg:rounded-2xl rounded-none flex flex-col items-center lg:border border-r border-vyre-border overflow-hidden flex-shrink-0 shadow-none lg:shadow-lg relative z-40">
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