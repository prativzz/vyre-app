import React, { useEffect, useState, useRef } from 'react';
import { API_URL } from '../config';
import { Send, Reply, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DirectMessages({ friend, token, socket, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friend.friend_id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (msg) => {
      // Only append if it belongs to this DM thread
      if (
        (msg.sender_id === user.id && msg.receiver_id === friend.friend_id) ||
        (msg.sender_id === friend.friend_id && msg.receiver_id === user.id)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    
    const handleDeletedMessage = ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    };

    socket.on('dm:new', handleNewMessage);
    socket.on('dm:deleted', handleDeletedMessage);

    return () => {
      socket.off('dm:new', handleNewMessage);
      socket.off('dm:deleted', handleDeletedMessage);
    };
  }, [socket, friend.friend_id, user.id]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_URL}/dms/${friend.friend_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Failed to fetch DMs", err);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;
    socket.emit('dm:send', { targetUserId: friend.friend_id, content: input, replyTo: replyTo?.id });
    setInput('');
    setReplyTo(null);
  };

  const deleteMessage = (id) => {
    if (window.confirm("Delete this message?")) {
      socket.emit('dm:delete', { messageId: id, targetUserId: friend.friend_id });
    }
  };

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';

  return (
    <div className="flex flex-col h-full w-full bg-gray-900/60 rounded-2xl overflow-hidden shadow-inner relative">
      {/* Header */}
      <div className="h-16 px-6 border-b border-gray-800 flex items-center bg-gray-900/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="flex items-center space-x-3">
          <span className={`w-3 h-3 rounded-full shadow-sm ${friend.online ? 'bg-green-500 shadow-green-500/50' : 'bg-gray-500'}`}></span>
          <h2 className="text-xl font-bold text-gray-100 tracking-wide">
            {friend.display_name || friend.username}
          </h2>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        <AnimatePresence initial={false}>
        {messages.map((m) => {
          const isMine = m.sender_id === user.id;
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
                  {getInitial(m.display_name || m.username)}
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
                  {isMine && (
                    <motion.button 
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => deleteMessage(m.id)}
                      className="p-1.5 text-gray-400 hover:text-red-400 bg-gray-800/50 hover:bg-gray-700/80 rounded-full transition-colors backdrop-blur-sm"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </motion.button>
                  )}
                </div>
              </div>
              <span className={`text-[11px] text-gray-500 mt-1 ${isMine ? 'mr-12' : 'ml-12'}`}>
                {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(m.createdAt))}
              </span>
            </motion.div>
          );
        })}
        </AnimatePresence>
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-gray-500 italic">
            Say hi to {friend.display_name || friend.username}!
          </div>
        )}
        <div ref={messagesEndRef} />
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
              Replying to <span className="font-semibold text-white ml-1 mr-2">{replyTo.username}</span>
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
              placeholder={`Message @${friend.username}`}
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
