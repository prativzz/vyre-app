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
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`relative rounded-3xl overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] h-full min-h-[200px] transition-all duration-300 ${
        isSpeaking ? 'bg-white/15 border-2 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.5)]' : 'bg-white/5 border border-white/10'
      } backdrop-blur-xl`}
    >
      {/* Glossy overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none z-10" />

      <ParticipantTile trackRef={trackRef} className="w-full h-full [&>.lk-participant-placeholder]:opacity-0 relative z-0" />
      
      {isCamMuted && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/60 backdrop-blur-md pointer-events-none z-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl overflow-hidden border-2 ${isSpeaking ? 'border-blue-400' : 'border-white/20'} bg-gradient-to-br from-indigo-500/80 to-purple-600/80 backdrop-blur-sm`}
          >
            {avatar ? (
              <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-bold text-white shadow-sm">{initial}</span>
            )}
          </motion.div>
        </div>
      )}
      
      <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-medium text-white flex items-center gap-2 z-20 border border-white/10 shadow-lg">
        <span>{isLocal ? 'You' : displayName}</span>
      </div>

      {isMicMuted && (
        <div className="absolute top-4 right-4 bg-red-500/80 backdrop-blur-md p-2 rounded-full text-white shadow-lg z-20 border border-red-400/50">
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
        <div className="col-span-full text-center text-gray-400 text-lg">
          Waiting for others to join...
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
      <div className="flex flex-col items-center justify-center h-full text-gray-300 p-6">
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 max-w-md w-full text-center">
          <div className="text-red-400 text-lg font-semibold mb-2">⚠️ Error</div>
          <div className="text-sm whitespace-pre-line">{error}</div>
          <button
            onClick={() => {
              setError(null);
              setLivekitToken('');
              fetchToken();
            }}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!livekitToken) {
    return <div className="flex items-center justify-center h-full text-gray-400">Connecting...</div>;
  }

  return (
    <div className="h-full flex flex-col bg-transparent relative z-10">
      <div className="p-4 bg-white/5 backdrop-blur-xl text-white font-bold border-b border-white/10 flex-shrink-0 shadow-sm z-20 flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
          🔊
        </div>
        <span className="tracking-wide">{channel.name}</span>
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
            <div className="flex-shrink-0 p-2">
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