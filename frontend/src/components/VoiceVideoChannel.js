import { API_URL } from '../config';
import { useEffect, useState } from 'react';
import {
  LiveKitRoom,
  LayoutContextProvider,
  ControlBar,
  ParticipantTile,
  useParticipants,
  useIsSpeaking
} from '@livekit/components-react';
import { Track, ParticipantEvent } from 'livekit-client';
import '@livekit/components-styles';
import { motion, AnimatePresence } from 'framer-motion';

function ParticipantWrapper({ participant }) {
  const [isMicMuted, setIsMicMuted] = useState(!participant.isMicrophoneEnabled);
  const [isCamMuted, setIsCamMuted] = useState(!participant.isCameraEnabled);
  const [avatar, setAvatar] = useState(null);

  useEffect(() => {
    // Fetch the user's avatar using their identity (which is their userId in our DB)
    fetch(`${API_URL}/user/${participant.identity}/profile`)
      .then(res => res.json())
      .then(data => {
        if (data.avatar) setAvatar(data.avatar);
      })
      .catch(err => console.error('Failed to fetch participant avatar:', err));
  }, [participant.identity]);

  useEffect(() => {
    const updateState = () => {
      setIsMicMuted(!participant.isMicrophoneEnabled);
      setIsCamMuted(!participant.isCameraEnabled);
    };

    updateState();

    // Listen for any track changes on this participant
    participant.on(ParticipantEvent.TrackMuted, updateState);
    participant.on(ParticipantEvent.TrackUnmuted, updateState);
    participant.on(ParticipantEvent.TrackPublished, updateState);
    participant.on(ParticipantEvent.TrackUnpublished, updateState);
    participant.on(ParticipantEvent.LocalTrackPublished, updateState);
    participant.on(ParticipantEvent.LocalTrackUnpublished, updateState);

    return () => {
      participant.off(ParticipantEvent.TrackMuted, updateState);
      participant.off(ParticipantEvent.TrackUnmuted, updateState);
      participant.off(ParticipantEvent.TrackPublished, updateState);
      participant.off(ParticipantEvent.TrackUnpublished, updateState);
      participant.off(ParticipantEvent.LocalTrackPublished, updateState);
      participant.off(ParticipantEvent.LocalTrackUnpublished, updateState);
    };
  }, [participant]);

  const isLocal = participant.isLocal;
  const displayName = participant.name || 'Unknown';
  const initial = displayName.charAt(0).toUpperCase();

  // Get the actual track publication so ParticipantTile can render the video stream
  const cameraPub = participant.getTrackPublication(Track.Source.Camera);
  const trackRef = {
    participant,
    publication: cameraPub,
    source: Track.Source.Camera,
  };

  const isSpeaking = useIsSpeaking(participant);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`relative rounded-2xl overflow-hidden h-full min-h-[200px] transition-all duration-300 ${
        isSpeaking ? 'bg-vyre-card border-2 border-vyre-accent shadow-[0_0_12px_rgba(16,185,129,0.3)]' : 'bg-vyre-secondary border border-vyre-border'
      }`}
    >
      <ParticipantTile trackRef={trackRef} className="w-full h-full [&>.lk-participant-placeholder]:opacity-0 relative z-0" />
      
      {isCamMuted && (
        <div className="absolute inset-0 flex items-center justify-center bg-vyre-bg/80 backdrop-blur-sm pointer-events-none z-10">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-24 h-24 rounded-[20px] flex items-center justify-center overflow-hidden border-2 bg-vyre-secondary shadow-sm ${isSpeaking ? 'border-vyre-accent' : 'border-vyre-border'}`}
          >
            {avatar ? (
              <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-bold font-pixel text-vyre-muted">{initial}</span>
            )}
          </motion.div>
        </div>
      )}
      
      <div className="absolute bottom-4 left-4 bg-vyre-card px-3 py-1.5 rounded-lg text-[10px] font-pixel uppercase tracking-widest text-vyre-text flex items-center gap-2 z-20 border border-vyre-border shadow-sm">
        <span>{isLocal ? 'You' : displayName}</span>
      </div>

      {isMicMuted && (
        <div className="absolute top-4 right-4 bg-red-500/10 p-2 rounded-lg text-red-400 shadow-sm z-20 border border-red-500/20">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" y1="1" x2="23" y2="23"></line>
            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
        </div>
      )}
    </motion.div>
  );
}

function VideoGrid() {
  const participants = useParticipants();

  // Dynamic columns based on participant count
  const count = participants.length;
  let cols = 1;
  if (count === 1) cols = 1;
  else if (count <= 4) cols = 2;
  else if (count <= 6) cols = 3;
  else cols = 4;

  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  return (
    <div className={`grid ${colClasses[cols]} gap-4 p-4 h-full w-full max-w-[1600px] mx-auto`}>
      <AnimatePresence>
      {participants.map((p) => (
        <ParticipantWrapper key={p.identity} participant={p} />
      ))}
      </AnimatePresence>
      {participants.length === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center text-vyre-muted opacity-50 h-full">
          <span className="font-pixel text-xs tracking-widest uppercase">Waiting for others to join...</span>
        </div>
      )}
    </div>
  );
}

export default function VoiceVideoChannel({ channel, serverId, token, onLeave }) {
  const [livekitToken, setLivekitToken] = useState('');
  const [error, setError] = useState(null);

  const fetchToken = () => {
    setError(null);
    fetch(`${API_URL}/livekit/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ roomName: `server-${serverId}-channel-${channel.id}` })
    })
      .then(res => res.json())
      .then(data => {
        if (data.token) setLivekitToken(data.token);
        else setError('Failed to get LiveKit token.');
      })
      .catch(() => setError('Network error.'));
  };

  useEffect(() => {
    fetchToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, serverId, token]);

  const handleDisconnected = () => {
    console.log('Disconnected from LiveKit room – clearing state.');
    if (onLeave) onLeave();
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-vyre-text p-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 max-w-md w-full text-center">
          <div className="text-red-400 text-lg font-bold mb-2 font-pixel tracking-widest uppercase">⚠️ Error</div>
          <div className="text-sm text-vyre-muted whitespace-pre-line">{error}</div>
          <button
            onClick={() => {
              setError(null);
              setLivekitToken('');
              fetchToken();
            }}
            className="mt-6 px-6 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 font-medium transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!livekitToken) {
    return <div className="flex items-center justify-center h-full text-vyre-muted font-pixel text-[10px] tracking-widest uppercase opacity-50">Connecting...</div>;
  }

  return (
    <div className="h-full flex flex-col bg-transparent relative z-10">
      <div className="p-4 bg-vyre-card text-vyre-text border-b border-vyre-border flex-shrink-0 shadow-sm z-20 flex items-center space-x-3">
        <div className="w-8 h-8 rounded-[8px] bg-vyre-secondary border border-vyre-border flex items-center justify-center text-vyre-muted">
          <span className="font-pixel text-[10px]">🔊</span>
        </div>
        <span className="font-bold tracking-wide">{channel.name}</span>
      </div>
      <div className="flex-1 min-h-0 relative flex flex-col">
        <LiveKitRoom
          serverUrl={process.env.REACT_APP_LIVEKIT_URL}
          token={livekitToken}
          connect={true}
          audio={true}
          video={true}
          className="flex-1 flex flex-col min-h-0"
          onError={(err) => console.error('LiveKit error:', err)}
          onDisconnected={handleDisconnected}
        >
          <LayoutContextProvider>
            <div className="flex-1 overflow-y-auto">
              <VideoGrid />
            </div>
            <div className="flex-shrink-0 p-2 border-t border-vyre-border bg-vyre-card">
              <ControlBar
                controls={{
                  microphone: true,
                  camera: true,
                  screenShare: true,
                  chat: false,
                  leave: true,
                }}
              />
            </div>
          </LayoutContextProvider>
        </LiveKitRoom>
      </div>
    </div>
  );
}