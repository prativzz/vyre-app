import { API_URL } from '../config';
import React, { useState, useEffect, useRef } from 'react';
import { Send, Reply, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatMessages({ channelId, token, socket, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const bottomRef = useRef();

  // Fetch initial messages
  useEffect(() => {
    fetch(`${API_URL}/channels/${channelId}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setMessages(data);
      })
      .catch(err => console.error('Error loading messages:', err));
  }, [channelId, token]);

  // --- Socket listeners ---
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = ({ channelId: chanId, message }) => {
      if (chanId === channelId) {
        setMessages(prev => [...prev, message]);
      }
    };

    socket.on('message:new', handleNewMessage);

    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [socket, channelId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    socket.emit('message:send', {
      channelId,
      content: input,
      replyTo: replyTo?.id || null
    });
    setInput('');
    setReplyTo(null);
  };


  const isOwnMessage = (msg) => msg.userId === user?.id;
  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';

  return (
    <div className="flex flex-col h-full w-full bg-gray-900/60 rounded-2xl overflow-hidden shadow-inner relative">
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        <AnimatePresence initial={false}>
        {messages.map((m, index) => {
          const isMine = isOwnMessage(m);
          return (
            <motion.div 
              key={m.id} 
              id={`msg-${m.id}`} 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} group w-full`}
            >
              
              {/* Reply Preview */}
              {m.reply_to && m.reply_content && (
                <div 
                  onClick={() => document.getElementById(`msg-${m.reply_to}`)?.scrollIntoView({ behavior: 'smooth' })}
                  className={`flex items-center text-xs text-gray-400 mb-1 cursor-pointer hover:text-gray-300 transition-colors ${isMine ? 'mr-12' : 'ml-12'}`}
                >
                  <Reply size={12} className="mr-1 inline-block -scale-x-100" />
                  <span className="font-semibold mr-1">{m.reply_username}:</span>
                  <span className="truncate max-w-[200px]">{m.reply_content}</span>
                </div>
              )}

              <div className={`flex items-end space-x-2 max-w-[70%] ${isMine ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-300 shadow-md border border-gray-700 overflow-hidden"
                >
                  {m.avatar || (isMine && user?.avatar) ? (
                    <img src={m.avatar || user?.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getInitial(m.display_name || m.username)
                  )}
                </motion.div>
                
                {/* Message Bubble */}
                <motion.div 
                  whileHover={{ y: -2 }}
                  className={`relative px-4 py-2 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.1)] text-[15px] leading-relaxed break-words transition-colors
                  ${isMine 
                    ? 'bg-blue-600/90 text-white rounded-br-sm border border-blue-500/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] hover:bg-blue-600' 
                    : 'bg-white/5 text-gray-100 rounded-bl-sm border border-white/10 backdrop-blur-md hover:bg-white/10'
                  }`}
                >
                  <div className="text-[10px] font-semibold mb-0.5 opacity-70">
                    {m.display_name || m.username}
                  </div>
                  {m.content}
                </motion.div>
                
                {/* Hover Actions */}
                <div className={`flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${isMine ? 'mr-2' : 'ml-2'}`}>
                  <motion.button 
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setReplyTo(m)}
                    className="p-1.5 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-700/80 rounded-full transition-colors backdrop-blur-sm"
                    title="Reply"
                  >
                    <Reply size={14} className="-scale-x-100" />
                  </motion.button>
                </div>
              </div>
              <span className={`text-[11px] text-gray-500 mt-1 ${isMine ? 'mr-12' : 'ml-12'}`}>
                {m.created_at ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(m.created_at)) : ''}
              </span>
            </motion.div>
          );
        })}
        </AnimatePresence>
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-gray-500 italic">
            No messages yet. Be the first to say hello!
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-transparent border-t border-white/5 relative z-10 before:absolute before:inset-0 before:bg-gradient-to-t before:from-gray-900/90 before:to-transparent before:backdrop-blur-md before:-z-10">
        {replyTo && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center justify-between bg-white/10 backdrop-blur-lg px-4 py-2 rounded-t-2xl border-l-4 border-blue-500 shadow-sm mb-[-12px] pb-5 z-0 relative"
          >
            <div className="flex items-center text-sm text-gray-300">
              <Reply size={14} className="mr-2 text-blue-400 -scale-x-100" />
              Replying to <span className="font-semibold text-white ml-1 mr-2">{replyTo.username || replyTo.display_name}</span>
            </div>
            <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </motion.div>
        )}
        <form onSubmit={sendMessage} className="relative z-10 mt-1">
          <div className="flex items-center bg-white/5 backdrop-blur-xl rounded-full overflow-hidden border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] focus-within:border-blue-500/50 focus-within:bg-white/10 transition-all duration-300">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-gray-100 px-6 py-3 focus:outline-none placeholder:text-gray-500"
            />
            <motion.button
              whileHover={input.trim() ? { scale: 1.05 } : {}}
              whileTap={input.trim() ? { scale: 0.95 } : {}}
              type="submit"
              disabled={!input.trim()}
              className="px-4 py-2 mr-2 text-white bg-blue-600 rounded-full disabled:opacity-50 disabled:bg-gray-700 transition-colors shadow-[0_2px_10px_rgba(37,99,235,0.3)]"
            >
              <Send size={18} className={input.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}