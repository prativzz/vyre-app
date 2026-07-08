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
import HeroInteraction from '../components/ui/HeroInteraction';
import { Menu, Users, X, UserCircle, Maximize2 } from 'lucide-react';
import PixelBackground from '../components/layout/PixelBackground';
import PixelLoader from '../components/ui/PixelLoader';
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
  const [showMobileProfile, setShowMobileProfile] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const retryCountRef = useRef(0);
  const retryTimerRef = useRef(null);

  const currentServerIdRef = useRef(selectedServer?.id);

  useEffect(() => {
    currentServerIdRef.current = selectedServer?.id;
  }, [selectedServer?.id]);

  const fetchChannels = useCallback(async (serverId) => {
    try {
      const res = await fetch(`${API_URL}/servers/${serverId}/channels`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch channels');
      const data = await res.json();
      // Prevent race condition: ignore if user switched servers during fetch
      if (currentServerIdRef.current !== serverId) return;
      setChannels(data);
    } catch (err) {
      console.error('Failed to fetch channels:', err);
    }
  }, [token]);

  const fetchMembers = useCallback(async () => {
    const fetchId = selectedServer?.id;
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
      if (!res.ok) throw new Error('Failed to fetch members');
      const data = await res.json();
      
      // Prevent race condition: ignore if user switched servers during fetch
      if (currentServerIdRef.current !== fetchId) return true;
      
      if (Array.isArray(data)) {
        setMembers(data);
      } else {
        setMembers([]);
      }
      return true;
    } catch (err) {
      console.error('Failed to fetch members:', err);
      return false;
    }
  }, [selectedServer, token]);

  const fetchFriends = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch friends');
      const data = await res.json();
      setFriends(data);
      return true;
    } catch (err) {
      console.error('Failed to fetch friends:', err);
      return false;
    }
  }, [token]);

  const fetchPendingRequests = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/friends/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch pending requests');
      const data = await res.json();
      setPendingRequests(data);
      return true;
    } catch (err) {
      console.error('Failed to fetch pending requests:', err);
      return false;
    }
  }, [token]);

  const fetchServers = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/user/servers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch servers');
      const data = await res.json();
      setServers(data);
      return true;
    } catch (err) {
      console.error('Failed to fetch servers:', err);
      return false;
    }
  }, [token]);

  const refreshAll = useCallback(async () => {
    const results = await Promise.all([
      fetchServers(),
      fetchFriends(),
      fetchMembers(),
      fetchPendingRequests()
    ]);
    // Always set isDataLoaded to true so the UI is unblocked even if backend is asleep
    setIsDataLoaded(true);
  }, [fetchServers, fetchFriends, fetchMembers, fetchPendingRequests]);

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
    refreshAll();
  }, [refreshAll]);

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

  // Normal polling removed in favor of Socket events and reliable initial load.

  // Socket reconnect -> start retry loop
  useEffect(() => {
    if (!socket) return;
    const onReconnect = () => {
      console.log('🔄 Socket reconnected – starting retry loop...');
      startRetry();
    };
    
    // Real-time friend updates
    const onFriendUpdate = () => {
      fetchFriends();
      fetchPendingRequests();
    };

    socket.on('connect', onReconnect);
    socket.on('reconnect', onReconnect);
    socket.on('friend:update', onFriendUpdate);
    
    return () => {
      socket.off('connect', onReconnect);
      socket.off('reconnect', onReconnect);
      socket.off('friend:update', onFriendUpdate);
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, [socket, startRetry, fetchFriends, fetchPendingRequests]);

  const handleSelectServer = (server) => {
    if (selectedServer?.id !== server?.id) {
      // Clear stale data to prevent flashing old members/channels
      setMembers([]);
      setChannels([]);
      setSelectedChannel(null);
      setActiveVoiceChannel(null);
      setSelectedServer(server);
    }
  };

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
      if (created) handleSelectServer(created);
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
        if (joined) handleSelectServer(joined);
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

  if (!isDataLoaded || !currentUser) {
    return <PixelLoader />;
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-vyre-bg overflow-hidden relative w-full max-w-[1920px] mx-auto">
      <PixelBackground />
      
      {/* Mobile Header (visible only on small screens) */}
      <div className="lg:hidden flex-none flex items-center justify-between p-3 bg-vyre-card border-b border-vyre-border w-full z-30 h-[60px] relative">
        <button 
          onClick={() => {
            setShowLeftSidebar(!showLeftSidebar);
            if (!showLeftSidebar) {
              setShowRightSidebar(false);
              setShowMobileProfile(false);
            }
          }}
          className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-vyre-muted hover:text-vyre-text bg-vyre-secondary rounded-lg"
        >
          {showLeftSidebar ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="font-bold font-pixel text-lg text-vyre-accent truncate px-2 text-center">
          {selectedServer ? selectedServer.name : (selectedFriend ? 'Direct Message' : 'Vyre')}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setShowRightSidebar(!showRightSidebar);
              if (!showRightSidebar) {
                setShowLeftSidebar(false);
                setShowMobileProfile(false);
              }
            }}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-vyre-muted hover:text-vyre-text bg-vyre-secondary rounded-lg relative"
          >
            {showRightSidebar ? <X size={20} /> : <Users size={20} />}
            {!showRightSidebar && pendingRequests.filter(p => p.type === 'received').length > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-vyre-accent rounded-full border-2 border-vyre-secondary"></span>
            )}
          </button>
          <button 
            onClick={() => {
              setShowMobileProfile(!showMobileProfile);
              if (!showMobileProfile) {
                setShowLeftSidebar(false);
                setShowRightSidebar(false);
              }
            }}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-vyre-muted hover:text-vyre-text bg-vyre-secondary rounded-lg"
          >
            {showMobileProfile ? <X size={20} /> : (
              currentUser?.avatar ? (
                <img src={currentUser.avatar} alt="Avatar" className="w-6 h-6 rounded-md object-cover" />
              ) : (
                <UserCircle size={20} />
              )
            )}
          </button>
        </div>
      </div>

      {/* Main Container for all content */}
      <div className="flex flex-1 w-full relative overflow-hidden lg:p-6 lg:gap-4 z-10 pb-[env(safe-area-inset-bottom)]">
        
        {/* Left Sidebars Wrapper */}
        <div className={`
          absolute lg:relative z-40 h-full flex lg:gap-4 transform transition-transform duration-300 ease-in-out left-0 top-0
          ${showLeftSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <ServerSidebar
        servers={servers}
        onSelectServer={handleSelectServer}
        onCreateServer={handleCreateServer}
        onJoinServer={handleJoinServer}
        selectedServerId={selectedServer?.id}
        token={token}
        friends={friends}
        pendingRequests={pendingRequests}
        onRefresh={refreshAll}
        onHome={() => {
          handleSelectServer(null);
          setSelectedFriend(null);
          setShowLeftSidebar(false);
        }}
      />

      {selectedServer && (
        <ChannelList
          channels={channels}
          selectedChannel={selectedChannel}
          onSelectChannel={(ch) => {
            if (ch && ch.type === 'voice') {
              if (activeVoiceChannel && activeVoiceChannel.id !== ch.id) {
                alert('You are already in a voice channel. Please leave it before joining another.');
                return;
              }
              setActiveVoiceChannel(ch);
            }
            setSelectedChannel(ch);
            setShowLeftSidebar(false);
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
            className="absolute inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setShowLeftSidebar(false)}
          />
        )}
        
        {/* Main Content Area */}
        <PixelPanel className="flex-1 flex flex-col w-full h-full lg:rounded-2xl rounded-none lg:shadow-lg shadow-none lg:border border-none border-vyre-border relative overflow-hidden">
        
        {/* Render VoiceVideoChannel independently so it stays mounted when navigating to text channels */}
        {activeVoiceChannel && (
          <div 
            className={`transition-all duration-300 group ${
              selectedChannel && selectedChannel.type === 'text' 
                ? 'absolute bottom-4 right-4 w-64 h-40 rounded-xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.5)] border-2 border-vyre-accent z-50 pointer-events-auto cursor-pointer'
                : 'absolute inset-0 z-20 bg-vyre-bg'
            }`}
            onClickCapture={(e) => {
              if (selectedChannel && selectedChannel.type === 'text') {
                e.preventDefault();
                e.stopPropagation();
                setSelectedChannel(activeVoiceChannel);
              }
            }}
            onTouchStartCapture={(e) => {
              if (selectedChannel && selectedChannel.type === 'text') {
                e.preventDefault();
                e.stopPropagation();
                setSelectedChannel(activeVoiceChannel);
              }
            }}
          >
            {/* Maximize Button for PiP mode */}
            {selectedChannel && selectedChannel.type === 'text' && (
              <div 
                className="absolute top-2 right-2 z-[60] bg-[#181B1F]/80 backdrop-blur-md p-1.5 rounded-lg cursor-pointer opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all hover:bg-vyre-accent text-white hover:text-black shadow-lg border border-white/10"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setSelectedChannel(activeVoiceChannel);
                }}
              >
                <Maximize2 size={16} />
              </div>
            )}
            
            {/* Click-catcher overlay for PiP mode */}
            {selectedChannel && selectedChannel.type === 'text' && (
              <div className="absolute inset-0 z-50" />
            )}
            <VoiceVideoChannel
              key={activeVoiceChannel.id}
              channel={activeVoiceChannel}
              serverId={selectedServer.id}
              token={token}
              socket={socket}
              onLeave={() => {
                setActiveVoiceChannel(null);
                if (selectedChannel?.id === activeVoiceChannel.id) {
                  setSelectedChannel(null);
                }
              }}
              isMinimized={selectedChannel && selectedChannel.type === 'text'}
            />
          </div>
        )}

        {!selectedServer && !selectedFriend ? (
          // Home page when no server and no friend selected
          <HeroInteraction>
            <div className="text-center px-4">
              <h1 className="text-7xl font-pixel font-bold text-vyre-accent tracking-wide leading-normal pb-4">
                VYRE
              </h1>
              <p className="text-vyre-muted mt-0 text-xs font-pixel tracking-[0.2em] uppercase">Connect. Chat. Collaborate.</p>
            </div>
          </HeroInteraction>
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
        ) : (!activeVoiceChannel) ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-lg font-medium">
            Select a channel to start chatting
          </div>
        ) : null}
        </PixelPanel>

      {/* Right Overlay */}
      {showRightSidebar && (
        <div 
          className="absolute inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setShowRightSidebar(false)}
        />
      )}

      {/* Right sidebar */}
      <div 
        className={`
          absolute lg:relative right-0 top-0 z-40 h-full w-[85vw] max-w-[288px] lg:w-72 flex flex-col lg:gap-4 transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${showRightSidebar ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Upper Card: Friends / Members */}
        <PixelPanel className="flex-1 flex flex-col p-3 lg:p-4 rounded-none lg:rounded-2xl border-none lg:border border-vyre-border shadow-none lg:shadow-lg overflow-hidden animate-fade-in bg-vyre-card">
          {!selectedServer ? (
            // ----- HOME PAGE: Friends + Pending Requests -----
            <>
              <div className="mb-3">
                <h3 className="font-pixel text-[10px] text-vyre-muted uppercase tracking-widest">
                  Friends — {friends.length} ({friendsOnline} online)
                </h3>
              </div>
              <div className="space-y-1 mb-4 flex-1 overflow-y-auto friends-scrollbar pr-1">
                {friends.map(f => (
                  <div 
                    key={f.friend_id} 
                    onClick={() => { handleSelectServer(null); setSelectedFriend(f); setShowRightSidebar(false); }}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-vyre-secondary transition-all duration-200 group cursor-pointer border border-transparent hover:border-vyre-border"
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`w-2 h-2 rounded-[2px] shadow-sm ${f.online ? 'bg-vyre-accent' : 'bg-vyre-border'}`}></span>
                      <span className="text-sm font-medium text-vyre-text group-hover:text-white transition-colors">{f.display_name || f.username}</span>
                    </div>
                    <div className="flex items-center space-x-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFriend(f.friend_id); }}
                        className="p-2 lg:p-1.5 min-w-[36px] min-h-[36px] lg:min-w-0 lg:min-h-0 flex items-center justify-center rounded text-vyre-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Remove Friend"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                {friends.length === 0 && <p className="text-xs text-gray-500 px-2">No friends yet.</p>}

                {pendingRequests.filter(p => p.type === 'received').length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-pixel text-[10px] text-vyre-muted uppercase tracking-widest mb-3">Friend Requests</h3>
                    <div className="space-y-1">
                      {pendingRequests.filter(p => p.type === 'received').map(p => (
                        <div key={p.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-vyre-secondary border border-vyre-border">
                          <span className="text-sm font-medium text-vyre-text">{p.display_name || p.username}</span>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => acceptFriendRequest(p.id)}
                              className="font-pixel text-[9px] uppercase tracking-wider bg-vyre-accent/10 text-vyre-accent hover:bg-vyre-accent hover:text-[#111] px-2 py-1 rounded transition-colors"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => declineFriendRequest(p.id)}
                              className="font-pixel text-[9px] uppercase tracking-wider bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white px-2 py-1 rounded transition-colors"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            // ----- INSIDE A SERVER: Show Server Members -----
            <>
              <div className="mb-3">
                <h3 className="font-pixel text-[10px] text-vyre-muted uppercase tracking-widest">
                  Members — {members.length} ({onlineCount} online)
                </h3>
              </div>
              <div className="space-y-1 overflow-y-auto flex-1 friends-scrollbar pr-1">
                {members.map(m => (
                  <div key={m.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-vyre-secondary transition-all duration-200 group border border-transparent hover:border-vyre-border hover:-translate-y-[2px] hover:scale-[1.01] hover:shadow-[0_4px_12px_rgba(44,200,140,0.05)]">
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
                  </div>
                ))}
                {members.length === 0 && <p className="text-gray-500 text-sm text-center mt-4">No members</p>}
              </div>
            </>
          )}
        </PixelPanel>

        {/* Lower Card: Profile & Logout */}
        <PixelPanel className="hidden lg:flex flex-shrink-0 p-4 rounded-2xl border border-vyre-border shadow-lg animate-fade-in flex-col">
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
              <div className="text-[11px] text-vyre-accent font-pixel tracking-wider uppercase mt-0.5 animate-pulse">{currentUser?.status || "Online"}</div>
            </div>
            <div className="text-vyre-muted text-sm font-pixel hover:text-vyre-text hover:drop-shadow-[0_0_8px_rgba(44,200,140,0.5)] transition-all">✎</div>
          </div>
          <button
            onClick={logout}
            className="mt-3 w-full py-2 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-all duration-300 hover:shadow-[0_4px_12px_rgba(239,68,68,0.15)]"
          >
            Logout
          </button>
        </PixelPanel>
      </div>

      {/* Mobile Profile Drawer Overlay */}
      {showMobileProfile && (
        <div 
          className="absolute inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setShowMobileProfile(false)}
        />
      )}

      {/* Mobile Profile Drawer */}
      <div 
        className={`
          absolute right-0 top-0 z-40 h-full w-[85vw] max-w-[288px] flex flex-col transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden
          ${showMobileProfile ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <PixelPanel className="flex-1 p-6 rounded-none lg:rounded-2xl border-none lg:border border-vyre-border shadow-none lg:shadow-lg animate-fade-in flex flex-col relative overflow-hidden bg-vyre-card">
          <div className="absolute inset-0 bg-vyre-accent/5 pointer-events-none" />
          
          <h2 className="font-pixel text-[11px] text-vyre-muted uppercase tracking-widest mb-6">Account</h2>
          
          <div className="flex flex-col items-center mb-8 relative z-10">
            <div className="w-24 h-24 rounded-2xl bg-vyre-accent flex items-center justify-center overflow-hidden shadow-lg relative text-vyre-bg border-2 border-vyre-card">
              <span className="font-bold text-3xl absolute font-pixel">{(currentUser?.display_name || currentUser?.username)?.[0]?.toUpperCase()}</span>
              {currentUser?.avatar && (
                <img src={currentUser.avatar} alt="avatar" className="w-full h-full object-cover relative z-10" referrerPolicy="no-referrer" onError={(e) => e.target.style.display = 'none'} />
              )}
              <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-lg bg-vyre-accent border-4 border-vyre-card shadow-sm z-20"></div>
            </div>
            
            <h3 className="mt-4 text-xl font-bold text-vyre-text">{currentUser?.display_name || currentUser?.username}</h3>
            <p className="text-vyre-muted text-sm mt-1">@{currentUser?.username}</p>
            <div className="mt-3 px-3 py-1 rounded-full bg-vyre-secondary border border-vyre-border text-xs font-pixel tracking-wider text-vyre-accent uppercase animate-pulse shadow-sm">
              {currentUser?.status || "Online"}
            </div>
          </div>

          <div className="flex-1 space-y-3 relative z-10">
            <button
              onClick={() => {
                setShowMobileProfile(false);
                setShowProfileModal(true);
              }}
              className="w-full py-3.5 rounded-xl bg-vyre-secondary hover:bg-vyre-border border border-vyre-border text-vyre-text text-sm font-medium transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <span>Edit Profile</span>
              <span className="text-vyre-muted">✎</span>
            </button>

          </div>

          <div className="mt-auto relative z-10">
            <button
              onClick={logout}
              className="w-full py-3.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-all shadow-sm"
            >
              Logout
            </button>
          </div>
        </PixelPanel>
      </div>

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