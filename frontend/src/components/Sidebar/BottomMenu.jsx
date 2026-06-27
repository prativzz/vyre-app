import { Home, UserPlus, Plus, Link, Settings } from 'lucide-react';
import BottomMenuButton from './BottomMenuButton';

export default function BottomMenu({
  activeNav,
  onNavigate,
  onAddFriend,
  onCreateServer,
  onJoinServer,
}) {
  const menuItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'add-friend', icon: UserPlus, label: 'Add Friend' },
    { id: 'create-server', icon: Plus, label: 'Create Server' },
    { id: 'join-server', icon: Link, label: 'Join Server' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const handleClick = (id) => {
    if (id === 'add-friend') {
      onAddFriend();
    } else if (id === 'create-server') {
      onCreateServer();
    } else if (id === 'join-server') {
      onJoinServer();
    } else {
      onNavigate(id);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-3 pt-4 pb-2 flex-shrink-0">
      {menuItems.map((item) => (
        <BottomMenuButton
          key={item.id}
          icon={item.icon}
          label={item.label}
          isActive={activeNav === item.id}
          onClick={() => handleClick(item.id)}
        />
      ))}
    </div>
  );
}