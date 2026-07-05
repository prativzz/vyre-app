import { API_URL } from '../config';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import useSocket from '../hooks/useSocket';
import ServerSidebar from '../components/ServerSidebar';
import ChannelList from '../components/ChannelList';
import ChatMessages from '../components/ChatMessages';
import VoiceVideoChannel from '../components/VoiceVideoChannel';
import DirectMessages from '../components/DirectMessages';
import ProfileModal from '../components/ProfileModal';
import CreateServerModal from '../components/CreateServerModal';
import { MessageSquare, Menu, Users, X } from 'lucide-react';
import PixelBackground from '../components/layout/PixelBackground';
import PixelPanel from '../components/ui/PixelPanel';

export default function Dashboard() {
  const { token, user, logout } = useAuth();
  const { socket } = useSocket(token);
  
  const [currentUser, setCurrentUser] = useState(user);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [servers, setServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState(null);
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [activeVoiceChannel, setActiveVoiceChannel] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [directCallTarget, setDirectCallTarget] = useState(null);
  const [members, setMembers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  
  // Mobile responsiveness state
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);

  const retryCountRef = useRef(0);
  const retryTimerRef = useRef(null);

  const fetchChannels = useCallback(async (serverId) => {
    const res = await fetch(`${API_URL}/servers/${serverId}/channels`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setChannels(data);
  }, [token]);

  const fetchMembers = useCallback(async () => {
    let url;
    if (selectedServer) {
      url = `${API_URL}/servers/${selectedServer.id}/members`;
    } else {
      url = `${API_URL}/users`;
    }
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setMembers(data);
      } else {
        setMembers([]);
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
    }
  }, [selectedServer, token]);

  const fetchFriends = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setFriends(data);
    } catch (err) {
      console.error('Failed to fetch friends:', err);
    }
  }, [token]);

  const fetchPendingRequests = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/friends/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setPendingRequests(data);
    } catch (err) {
      console.error('Failed to fetch pending requests:', err);
    }
  }, [token]);

  const refreshAll = useCallback(() => {
    fetchFriends();
    fetchMembers();
    fetchPendingRequests();
  }, [fetchFriends, fetchMembers, fetchPendingRequests]);

  const startRetry = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    retryCountRef.current = 0;

    const attemptRefresh = () => {
      console.log(`🔄 Retry attempt ${retryCountRef.current + 1}`);
      refreshAll();
      retryCountRef.current += 1;
      if (retryCountRef.current < 5) {
        retryTimerRef.current = setTimeout(attemptRefresh, 1000);
      } else {
        console.log('✅ Retry complete');
        retryTimerRef.current = null;
      }
    };
    attemptRefresh();
  }, [refreshAll]);

  // Initial data fetch
  useEffect(() => {
    fetch(`${API_URL}/user/servers`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.json()).then(setServers);
    refreshAll();
  }, [token, refreshAll]);

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  useEffect(() => {
    if (selectedServer) {
      fetchChannels(selectedServer.id);
      socket?.emit('join:server', selectedServer.id);
    }
    fetchMembers();
  }, [selectedServer, socket, token, fetchChannels, fetchMembers]);

  // Normal polling (every 5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAll();
    }, 5000);
    return () => clearInterval(interval);
  }, [refreshAll]);

  // Socket reconnect -> start retry loop
  useEffect(() => {
    if (!socket) return;
    const onReconnect = () => {
      console.log('🔄 Socket reconnected – starting retry loop...');
      startRetry();
    };
    socket.on('connect', onReconnect);
    socket.on('reconnect', onReconnect);
    return () => {
      socket.off('connect', onReconnect);
      socket.off('reconnect', onReconnect);
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, [socket, startRetry]);



  const handleCreateServer = async (name, template) => {
    const res = await fetch(`${API_URL}/servers/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, template })
    });
    if (res.ok) {
      const newServerData = await res.json();
      const updatedServers = await fetch(`${API_URL}/user/servers`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json());
      setServers(updatedServers);
      const created = updatedServers.find(s => s.id === newServerData.serverId);
      if (created) setSelectedServer(created);
    }
    setShowCreateModal(false);
  };

  const handleJoinServer = async (inviteCode) => {
    try {
      const res = await fetch(`${API_URL}/servers/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ inviteCode })
      });
      const data = await res.json();
      if (res.ok) {
        const updatedServers = await fetch(`${API_URL}/user/servers`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json());
        setServers(updatedServers);
        const joined = updatedServers.find(s => s.id === data.serverId);
        if (joined) setSelectedServer(joined);
      } else {
        alert(data.error || 'Invalid invite code');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const handleProfileUpdate = (updatedUser) => {
    setCurrentUser(prev => ({ ...prev, ...updatedUser }));
  };

  const acceptFriendRequest = async (friendId) => {
    try {
      const res = await fetch(`${API_URL}/friends/accept`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ friendId })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Friend added!');
        refreshAll();
      } else {
        alert(data.error || 'Failed to accept');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
  };

  const declineFriendRequest = async (friendId) => {
    if (!window.confirm('Decline friend request?')) return;
    try {
      const res = await fetch(`${API_URL}/friends/decline`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ friendId })
      });
      const data = await res.json();
      if (res.ok) {
        refreshAll();
      } else {
        alert(data.error || 'Failed to decline');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
  };

  const removeFriend = async (friendId) => {
    if (!window.confirm('Remove this friend?')) return;
    try {
      const res = await fetch(`${API_URL}/friends/decline`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ friendId })
      });
      const data = await res.json();
      if (res.ok) {
        refreshAll();
      } else {
        alert(data.error || 'Failed to remove friend');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
  };

  const onlineCount = members.filter(m => m.online).length;
  const friendsOnline = friends.filter(f => f.online).length;

  return (
    <div className="flex h-screen bg-vyre-bg overflow-hidden relative">
      <PixelBackground />
      
      {/* Mobile Header (visible only on small screens) */}
      <div className="lg:hidden flex items-center justify-between p-3 bg-vyre-card border-b border-vyre-border absolute top-0 w-full z-30">
        <button 
          onClick={() => setShowLeftSidebar(!showLeftSidebar)}
          className="p-2 text-vyre-muted hover:text-vyre-text bg-vyre-secondary rounded-lg"
        >
          {showLeftSidebar ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="font-bold font-pixel text-lg text-vyre-accent">
          {selectedServer ? selectedServer.name : (selectedFriend ? 'Direct Message' : 'Vyre')}
        </div>
        <button 
          onClick={() => setShowRightSidebar(!showRightSidebar)}
          className="p-2 text-vyre-muted hover:text-vyre-text bg-vyre-secondary rounded-lg"
        >
          {showRightSidebar ? <X size={20} /> : <Users size={20} />}
        </button>
      </div>

      {/* Main Container for all content */}
      <div className="flex flex-1 w-full h-full pt-[60px] lg:pt-0 p-0 lg:p-4 gap-4 z-10 max-w-[1920px] mx-auto">
        
        {/* Left Sidebars Wrapper */}
        <div className={`
          absolute lg:relative z-40 h-full flex transform transition-transform duration-300 ease-in-out
          ${showLeftSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <ServerSidebar

        servers={servers}
        onSelectServer={setSelectedServer}
        onCreateServer={handleCreateServer}
        onJoinServer={handleJoinServer}
        selectedServerId={selectedServer?.id}
        token={token}
        friends={friends}
        pendingRequests={pendingRequests}
        onRefresh={refreshAll}
        onHome={() => {
          setSelectedServer(null);
          setSelectedFriend(null);
        }}
      />

      {selectedServer && (
        <ChannelList
          channels={channels}
          selectedChannel={selectedChannel}
          onSelectChannel={(ch) => {
            setSelectedChannel(ch);
            if (ch && ch.type === 'voice') setActiveVoiceChannel(ch);
            else setActiveVoiceChannel(null);
          }}
          serverName={selectedServer.name}
          inviteCode={selectedServer.invite_code}
          serverId={selectedServer.id}
          serverOwnerId={selectedServer.owner_id}
          currentUserId={currentUser?.id}
          token={token}
          fetchChannels={fetchChannels}
          onServerDeleted={() => {
            refreshAll();
            setSelectedServer(null);
          }}
          />
        )}
        </div>

        {/* Overlay for mobile when sidebar is open */}
        {showLeftSidebar && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setShowLeftSidebar(false)}
          />
        )}
        
        {/* Main Content Area */}
        <PixelPanel className="flex-1 flex flex-col w-full h-full rounded-2xl shadow-lg border border-vyre-border">
        {!selectedServer && !selectedFriend ? (
          // Home page when no server and no friend selected
          <div className="flex flex-1 items-center justify-center px-4">
            <div className="text-center">
              <h1 className="text-7xl font-pixel font-bold text-vyre-accent tracking-wide leading-normal pb-4">
                VYRE
              </h1>
              <p className="text-vyre-muted mt-0 text-xs font-pixel tracking-[0.2em] uppercase">Connect. Chat. Collaborate.</p>
            </div>
          </div>
        ) : !selectedServer && selectedFriend ? (
          <DirectMessages 
            friend={selectedFriend}
            token={token}
            socket={socket}
            user={currentUser}
          />
        ) : selectedChannel && selectedChannel.type === 'text' ? (
          <ChatMessages 
            channelId={selectedChannel.id} 
            token={token} 
            socket={socket} 
            user={currentUser}
          />
        ) : activeVoiceChannel ? (
          <VoiceVideoChannel
            channel={activeVoiceChannel}
            serverId={selectedServer.id}
            token={token}
            socket={socket}
            onLeave={() => {
              setActiveVoiceChannel(null);
              setSelectedChannel(null);
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-lg font-medium">
            Select a channel to start chatting
          </div>
        )}
        </PixelPanel>

      {/* Right Overlay */}
      {showRightSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setShowRightSidebar(false)}
        />
      )}

      {/* Right sidebar */}
      <PixelPanel 
        className={`
          absolute lg:relative right-0 z-40 h-full w-72 flex flex-col overflow-y-auto transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${showRightSidebar ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          rounded-2xl border-vyre-border shadow-lg
        `}
      >
        <div className="p-4 flex flex-col h-full">
        {!selectedServer ? (

          // ----- HOME PAGE: Friends + Pending Requests -----
          <>
            <div className="mb-3">
              <h3 className="font-pixel text-[10px] text-vyre-muted uppercase tracking-widest">
                Friends — {friends.length} ({friendsOnline} online)
              </h3>
            </div>
            <div className="space-y-1 mb-4 flex-1 overflow-y-auto">
              {friends.map(f => (
                <div key={f.friend_id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-vyre-secondary transition-all duration-200 group cursor-pointer border border-transparent hover:border-vyre-border">
                  <div className="flex items-center space-x-3">
                    <span className={`w-2 h-2 rounded-[2px] shadow-sm ${f.online ? 'bg-vyre-accent' : 'bg-vyre-border'}`}></span>
                    <span className="text-sm font-medium text-vyre-text group-hover:text-white transition-colors">{f.display_name || f.username}</span>
                  </div>
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {f.online && (
                      <span className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50 inline-block mr-1"></span>
                      </span>
                    )}
                    <button
                      onClick={() => { setSelectedServer(null); setSelectedFriend(f); }}
                      className="p-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition shadow-md"
                      title="Message"
                    >
                      <MessageSquare size={14} />
                    </button>
                    <button
                      onClick={() => removeFriend(f.friend_id)}
                      className="p-1.5 rounded-full text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      title="Remove Friend"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              {friends.length === 0 && <p className="text-xs text-gray-500 px-2">No friends yet.</p>}
            </div>

            {pendingRequests.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Friend Requests</h3>
                <div className="space-y-1">
                  {pendingRequests.map(p => (
                    <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-700/50 transition-all duration-200 border border-transparent hover:border-gray-600/50">
                      <span className="text-sm font-medium text-gray-200">{p.display_name || p.username}</span>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => acceptFriendRequest(p.id)}
                          className="text-xs bg-green-600 hover:bg-green-500 text-white px-2 py-0.5 rounded"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => declineFriendRequest(p.id)}
                          className="text-xs bg-red-600 hover:bg-red-500 text-white px-2 py-0.5 rounded"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          // ----- INSIDE A SERVER: Show Server Members -----
          <>
            <div className="mb-3">
              <h3 className="font-pixel text-[10px] text-vyre-muted uppercase tracking-widest">
                Members — {members.length} ({onlineCount} online)
              </h3>
            </div>
            <div className="space-y-1 overflow-y-auto flex-1">
              {members.map(m => (
                <div key={m.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-vyre-secondary transition group">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-xl bg-vyre-secondary flex items-center justify-center text-sm font-pixel font-bold shadow-sm overflow-hidden text-vyre-muted">
                        {m.avatar ? (
                          <img src={m.avatar} alt="avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <span>{(m.display_name || m.username)[0].toUpperCase()}</span>
                        )}
                      </div>
                      <span className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-[2px] border-2 border-vyre-card ${m.online ? 'bg-vyre-accent' : 'bg-vyre-border'}`}></span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-vyre-text">{m.display_name || m.username}</div>
                      {m.status && <div className="text-xs text-gray-400">{m.status}</div>}
                    </div>
                  </div>
                  {m.online && m.id !== currentUser?.id && (
                    <button
                      onClick={() => setDirectCallTarget({ id: m.id, username: m.username, isIncoming: false })}
                      className="text-xs rounded-full bg-blue-600 hover:bg-blue-500 transition shadow-md opacity-0 group-hover:opacity-100 px-2 py-0.5"
                    >
                      Call
                    </button>
                  )}
                </div>
              ))}
              {members.length === 0 && <p className="text-gray-500 text-sm text-center mt-4">No members</p>}
            </div>
          </>
        )}

        {/* Profile & Logout (always visible at bottom) */}
        <div className="mt-4 border-t border-vyre-border pt-4 flex-shrink-0">
          <div
            onClick={() => setShowProfileModal(true)}
            className="flex items-center space-x-3 p-2 rounded-xl bg-vyre-secondary hover:bg-vyre-border cursor-pointer transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-vyre-accent flex items-center justify-center overflow-hidden shadow-sm relative text-vyre-bg">
              <span className="font-bold text-lg absolute font-pixel">{(currentUser?.display_name || currentUser?.username)?.[0]?.toUpperCase()}</span>
              {currentUser?.avatar && (
                <img src={currentUser.avatar} alt="avatar" className="w-full h-full object-cover relative z-10" referrerPolicy="no-referrer" onError={(e) => e.target.style.display = 'none'} />
              )}
            </div>
            <div className="flex-1">
              <div className="font-medium text-vyre-text text-sm">{currentUser?.display_name || currentUser?.username}</div>
              <div className="text-[11px] text-vyre-accent font-pixel tracking-wider uppercase mt-0.5">{currentUser?.status || "Online"}</div>
            </div>
            <div className="text-vyre-muted text-sm font-pixel hover:text-vyre-text">✎</div>
          </div>
          <button
            onClick={logout}
            className="mt-3 w-full py-2 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-all"
          >
            Logout
          </button>
        </div>
        </div>
      </PixelPanel>

      {showProfileModal && (
        <ProfileModal
          user={currentUser}
          token={token}
          onClose={() => setShowProfileModal(false)}
          onUpdate={handleProfileUpdate}
        />
      )}
      {showCreateModal && (
        <CreateServerModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateServer}
        />
      )}
      </div>
    </div>
  );
}