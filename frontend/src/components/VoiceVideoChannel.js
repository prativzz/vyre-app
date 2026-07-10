import { API_URL } from '../config';
import { useEffect, useState } from 'react';
import {
  LiveKitRoom,
  LayoutContextProvider,
  ParticipantTile,
  useParticipants,
  useTracks,
  useIsSpeaking,
  useLocalParticipant,
  RoomAudioRenderer
} from '@livekit/components-react';
import { Track, ParticipantEvent } from 'livekit-client';
import '@livekit/components-styles';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, CameraOff } from 'lucide-react';
import PixelBackground from './layout/PixelBackground';

// Custom pixel spark particle component for button hovers
function PixelSparkles({ active }) {
  const [sparks, setSparks] = useState([]);
  
  useEffect(() => {
    if (!active) return;
    
    // Spawn 2-4 tiny sparks
    const count = Math.floor(Math.random() * 3) + 2;
    const newSparks = Array.from({ length: count }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 20, // -10px to +10px from center
      delay: Math.random() * 0.2
    }));
    
    setSparks(newSparks);
    
    const timeout = setTimeout(() => {
      setSparks([]);
    }, 800);
    
    return () => clearTimeout(timeout);
  }, [active]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible z-50">
      <AnimatePresence>
        {sparks.map(spark => (
          <motion.div
            key={spark.id}
            initial={{ opacity: 0, y: 0, x: spark.x }}
            animate={{ opacity: [0, 1, 0], y: -20 - Math.random() * 15, x: spark.x + (Math.random() - 0.5) * 10 }}
            transition={{ duration: 0.5, delay: spark.delay, ease: "easeOut" }}
            className="absolute top-0 left-1/2 w-1 h-1 bg-vyre-accent rounded-sm shadow-[0_0_2px_#20C997]"
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Custom Control Button
function ControlButton({ icon: Icon, label, active, danger, onClick }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className="relative flex flex-col items-center justify-center group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.button
        whileHover={{ scale: 1.03, y: -3 }}
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-colors border ${
          danger 
            ? 'bg-[#2A1515] border-[#3A1D1D] hover:bg-[#321919] hover:border-[#4A2525] text-red-400 hover:shadow-[0_4px_16px_rgba(239,68,68,0.15)]'
            : active 
              ? 'bg-[#181B1F] border-vyre-accent/30 text-vyre-accent hover:bg-[#1A1F24] hover:border-vyre-accent/50'
              : 'bg-[#23272E] border-white/5 text-[#A5ABB3] hover:bg-[#2D323A] hover:border-vyre-accent/40 hover:text-white'
        }`}
      >
        <div className="absolute inset-0 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] pointer-events-none" />
        
        <Icon size={22} className={`transition-transform duration-300 ${isHovered && !danger ? 'scale-110' : ''}`} />
        
        {/* Active Breathing Badge */}
        {active && !danger && (
          <motion.div 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-3 right-3 w-1.5 h-1.5 bg-vyre-accent rounded-sm shadow-[0_0_4px_#20C997]"
          />
        )}
      </motion.button>
      <PixelSparkles active={isHovered && !danger} />
    </div>
  );
}

// Custom Control Dock matching the Linear/Raycast aesthetic
function CustomDock({ onLeave }) {
  const { localParticipant } = useLocalParticipant();
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCamEnabled, setIsCamEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  useEffect(() => {
    if (!localParticipant) return;
    setIsMicEnabled(localParticipant.isMicrophoneEnabled);
    setIsCamEnabled(localParticipant.isCameraEnabled);
    setIsScreenSharing(localParticipant.isScreenShareEnabled);

    const updateState = () => {
      setIsMicEnabled(localParticipant.isMicrophoneEnabled);
      setIsCamEnabled(localParticipant.isCameraEnabled);
      setIsScreenSharing(localParticipant.isScreenShareEnabled);
    };

    localParticipant.on(ParticipantEvent.LocalTrackPublished, updateState);
    localParticipant.on(ParticipantEvent.LocalTrackUnpublished, updateState);
    localParticipant.on(ParticipantEvent.TrackMuted, updateState);
    localParticipant.on(ParticipantEvent.TrackUnmuted, updateState);

    return () => {
      localParticipant.off(ParticipantEvent.LocalTrackPublished, updateState);
      localParticipant.off(ParticipantEvent.LocalTrackUnpublished, updateState);
      localParticipant.off(ParticipantEvent.TrackMuted, updateState);
      localParticipant.off(ParticipantEvent.TrackUnmuted, updateState);
    };
  }, [localParticipant]);

  const toggleMic = async () => {
    if (localParticipant) {
      await localParticipant.setMicrophoneEnabled(!isMicEnabled);
    }
  };

  const toggleCam = async () => {
    if (localParticipant) {
      await localParticipant.setCameraEnabled(!isCamEnabled);
    }
  };

  const toggleScreen = async () => {
    if (localParticipant) {
      await localParticipant.setScreenShareEnabled(!isScreenSharing);
    }
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 200 }}
        className="flex items-center gap-4 bg-[#181B1F]/90 backdrop-blur-xl p-3 rounded-[24px] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
      >
        <ControlButton 
          icon={isMicEnabled ? Mic : MicOff} 
          label="Microphone" 
          active={isMicEnabled} 
          onClick={toggleMic} 
        />
        <ControlButton 
          icon={isCamEnabled ? Video : VideoOff} 
          label="Camera" 
          active={isCamEnabled} 
          onClick={toggleCam} 
        />
        <div className="w-[1px] h-8 bg-white/5 mx-1" />
        <ControlButton 
          icon={MonitorUp} 
          label="Screen Share" 
          active={isScreenSharing} 
          onClick={toggleScreen} 
        />
        <div className="w-[1px] h-8 bg-white/5 mx-1" />
        <ControlButton 
          icon={PhoneOff} 
          label="Leave" 
          danger 
          onClick={onLeave} 
        />
      </motion.div>
    </div>
  );
}

function ParticipantWrapper({ trackRef, styleClass }) {
  const participant = trackRef.participant;
  const [isMicMuted, setIsMicMuted] = useState(!participant.isMicrophoneEnabled);
  const [isCamMuted, setIsCamMuted] = useState(!participant.isCameraEnabled);
  const [avatar, setAvatar] = useState(null);

  useEffect(() => {
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
  const displayName = participant.name || '';
  const initial = displayName ? displayName.charAt(0).toUpperCase() : '';

  const isScreenShare = trackRef.source === Track.Source.ScreenShare;

  const isSpeaking = useIsSpeaking(participant);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", damping: 20, stiffness: 200 }}
      className={`relative w-full h-full ${styleClass || ''}`}
    >
      <div className="relative w-full h-full rounded-3xl overflow-hidden bg-[#181B1F] border border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.2)] group" style={{ isolation: 'isolate', transform: 'translateZ(0)' }}>
      <div className="absolute inset-0 rounded-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] pointer-events-none z-30" />
      
      {/* Speaking Border Pulse */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-20 pointer-events-none rounded-3xl p-[2px]"
            style={{
              background: 'linear-gradient(90deg, rgba(32,201,151,0) 0%, rgba(32,201,151,0.5) 50%, rgba(32,201,151,0) 100%)',
              backgroundSize: '200% 100%',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
          >
            <motion.div 
              animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              className="w-full h-full rounded-3xl"
              style={{
                background: 'linear-gradient(90deg, rgba(32,201,151,0) 0%, rgba(32,201,151,0.8) 50%, rgba(32,201,151,0) 100%)',
                backgroundSize: '200% 100%',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <ParticipantTile trackRef={trackRef} className={`w-full h-full [&_video]:rounded-3xl ${isScreenShare ? '[&_video]:object-contain bg-[#111315]' : '[&_video]:object-cover'} [&_video]:w-full [&_video]:h-full [&_.lk-participant-placeholder]:hidden [&_.lk-participant-metadata]:hidden [&_.lk-focus-toggle-button]:hidden [&_.lk-focus-toggle]:hidden [&_.lk-connection-quality]:hidden [&_.lk-participant-name]:hidden relative z-0`} />
      
      {(!isScreenShare && isCamMuted) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111315]/95 z-10 backdrop-blur-md rounded-3xl">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 150 }}
            className="relative"
          >
            <div className="w-28 h-28 rounded-full flex items-center justify-center overflow-hidden border border-white/10 bg-[#181B1F] shadow-2xl relative z-10">
              {avatar ? (
                <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold font-pixel text-vyre-muted">{initial}</span>
              )}
            </div>
            <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-[#23272E] rounded-full border border-white/5 shadow-lg flex items-center justify-center z-20 text-vyre-muted">
              <CameraOff size={18} />
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mt-6 flex flex-col items-center"
          >
            <span className="font-pixel text-[11px] tracking-[0.2em] uppercase text-vyre-muted/60">Camera Disabled</span>
          </motion.div>
        </div>
      )}
      
      {/* Floating Username Chip */}
      <div className="absolute bottom-4 left-4 bg-[#181B1F]/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-medium text-white/90 flex items-center gap-2 z-30 border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
        <div className="w-1.5 h-1.5 bg-vyre-accent rounded-full shadow-[0_0_4px_rgba(32,201,151,0.5)]" />
        <span>{isLocal ? 'You' : displayName}{isScreenShare ? "'s Screen" : ""}</span>
      </div>

      {/* Muted Pill */}
      <AnimatePresence>
        {isMicMuted && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-4 right-4 bg-[#181B1F]/90 backdrop-blur-md p-2 rounded-xl text-red-400/90 shadow-[0_4px_12px_rgba(0,0,0,0.3)] z-30 border border-white/10"
          >
            <MicOff size={16} />
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </motion.div>
  );
}

function VideoGrid({ isMinimized }) {
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);
  const participants = useParticipants();
  const count = tracks.length;
  
  const getGridClasses = (count, isMinimized) => {
    if (isMinimized) {
      switch(count) {
        case 1: return "grid-cols-1 grid-rows-1";
        case 2: return "grid-cols-2 grid-rows-1";
        case 3: return "grid-cols-2 grid-rows-2";
        case 4: return "grid-cols-2 grid-rows-2";
        case 5: return "grid-cols-3 grid-rows-2";
        case 6: return "grid-cols-3 grid-rows-2";
        default: return "grid-cols-2 grid-rows-2"; 
      }
    }
    switch(count) {
      case 1: return "grid-cols-1 grid-rows-1";
      case 2: return "grid-cols-1 grid-rows-2 lg:grid-cols-2 lg:grid-rows-1";
      case 3: return "grid-cols-1 grid-rows-3 lg:grid-cols-2 lg:grid-rows-2";
      case 4: return "grid-cols-2 grid-rows-2";
      case 5: return "grid-cols-2 grid-rows-3 lg:grid-cols-6 lg:grid-rows-2";
      case 6: return "grid-cols-2 grid-rows-3 lg:grid-cols-3 lg:grid-rows-2";
      default: return "grid-cols-2 lg:grid-cols-3"; 
    }
  };

  const getItemClass = (count, index, isMinimized) => {
    if (isMinimized) {
      if (count === 3 && index === 2) return "col-span-2 w-1/2 place-self-center";
      return "";
    }
    if (count === 3 && index === 2) {
      return "lg:col-span-2 lg:w-1/2 lg:place-self-center"; 
    }
    if (count === 5) {
      let classes = "";
      if (index === 4) classes = "col-span-2 w-1/2 place-self-center lg:col-span-3 lg:w-full lg:place-self-auto";
      else if (index >= 3) classes = "lg:col-span-3";
      else classes = "lg:col-span-2";
      return classes;
    }
    return "";
  };

  return (
    <div className={`absolute inset-0 flex items-center justify-center ${isMinimized ? 'p-0' : 'p-2 lg:p-6 pb-28 lg:pb-32'}`}>
      <div className={`grid w-full h-full max-w-[1800px] mx-auto ${isMinimized ? 'gap-0' : 'gap-2 lg:gap-4'} ${getGridClasses(count, isMinimized)}`}>
        <AnimatePresence mode="popLayout">
          {tracks.map((t, i) => (
            <ParticipantWrapper key={`${t.participant.isLocal ? 'local' : (t.participant.identity || t.participant.sid)}-${t.source}`} trackRef={t} styleClass={getItemClass(count, i, isMinimized)} />
          ))}
        </AnimatePresence>
        {participants.length === 0 && (
          <div className="col-span-full row-span-full flex flex-col items-center justify-center text-vyre-muted opacity-50 h-full w-full">
            <span className="font-pixel text-[11px] tracking-widest uppercase">Waiting for others to join...</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VoiceVideoChannel({ channel, serverId, token, onLeave, isMinimized }) {
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
    if (onLeave) onLeave();
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#111315] text-vyre-text p-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 max-w-md w-full text-center">
          <div className="text-red-400 text-lg font-bold mb-2 font-pixel tracking-widest uppercase">⚠️ Error</div>
          <div className="text-sm text-vyre-muted whitespace-pre-line">{error}</div>
          <button
            onClick={fetchToken}
            className="mt-6 px-6 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-400 font-medium transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!livekitToken) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#111315]">
        <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}>
          <span className="font-pixel text-[10px] tracking-[0.2em] uppercase text-vyre-muted">Connecting...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col relative overflow-hidden ${isMinimized ? 'bg-transparent' : 'bg-[#111315]'}`}>
      {/* Premium Ambient Background */}
      {!isMinimized && (
        <div className="absolute inset-0 opacity-30 z-0 pointer-events-none">
          <PixelBackground />
        </div>
      )}



      <div className="flex-1 w-full h-full relative z-10">
        <LiveKitRoom
          serverUrl={process.env.REACT_APP_LIVEKIT_URL}
          token={livekitToken}
          connect={true}
          audio={true}
          video={true}
          className="w-full h-full flex flex-col relative"
          onError={(err) => console.error('LiveKit error:', err)}
          onDisconnected={handleDisconnected}
        >
          <LayoutContextProvider>
            <RoomAudioRenderer />
            <VideoGrid isMinimized={isMinimized} />
            {!isMinimized && <CustomDock onLeave={onLeave} />}
          </LayoutContextProvider>
        </LiveKitRoom>
      </div>
    </div>
  );
}