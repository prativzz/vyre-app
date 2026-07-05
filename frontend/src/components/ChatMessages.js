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
    <div className="flex flex-col h-full w-full bg-transparent rounded-2xl overflow-hidden relative">
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        <AnimatePresence initial={false}>
        {messages.map((m) => {
          const isMine = isOwnMessage(m);
          return (
            <motion.div 
              key={m.id} 
              id={`msg-${m.id}`} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} group w-full`}
            >
              
              {/* Reply Preview */}
              {m.reply_to && m.reply_content && (
                <div 
                  onClick={() => document.getElementById(`msg-${m.reply_to}`)?.scrollIntoView({ behavior: 'smooth' })}
                  className={`flex items-center text-xs text-vyre-muted mb-1 cursor-pointer hover:text-vyre-text transition-colors ${isMine ? 'mr-12' : 'ml-12'}`}
                >
                  <Reply size={12} className="mr-1 inline-block -scale-x-100" />
                  <span className="font-semibold mr-1 font-pixel text-[10px] uppercase tracking-wider">{m.reply_username}:</span>
                  <span className="truncate max-w-[200px]">{m.reply_content}</span>
                </div>
              )}

              <div className={`flex items-end space-x-3 max-w-[75%] ${isMine ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className="flex-shrink-0 w-8 h-8 rounded-[8px] bg-vyre-secondary flex items-center justify-center text-xs font-pixel text-vyre-muted border border-vyre-border overflow-hidden">
                  {m.avatar || (isMine && user?.avatar) ? (
                    <img src={m.avatar || user?.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getInitial(m.display_name || m.username)
                  )}
                </div>
                
                {/* Message Bubble */}
                <motion.div 
                  whileHover={{ y: -1 }}
                  className={`relative px-4 py-2 text-[15px] leading-relaxed break-words transition-transform
                  ${isMine 
                    ? 'bg-vyre-accent text-vyre-bg rounded-2xl rounded-br-sm shadow-sm' 
                    : 'bg-vyre-secondary text-vyre-text border border-vyre-border rounded-2xl rounded-bl-sm shadow-sm'
                  }`}
                >
                  <div className={`text-[10px] font-pixel mb-1 tracking-wider uppercase ${isMine ? 'text-vyre-bg/70' : 'text-vyre-accent'}`}>
                    {m.display_name || m.username}
                  </div>
                  {m.content}
                </motion.div>
                
                {/* Hover Actions */}
                <div className={`flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${isMine ? 'mr-2' : 'ml-2'}`}>
                  <button 
                    onClick={() => setReplyTo(m)}
                    className="p-1.5 text-vyre-muted hover:text-vyre-text bg-vyre-secondary hover:bg-vyre-border rounded-md transition-colors border border-vyre-border"
                    title="Reply"
                  >
                    <Reply size={14} className="-scale-x-100" />
                  </button>
                </div>
              </div>
              <span className={`text-[10px] text-vyre-muted mt-1 font-pixel tracking-widest uppercase ${isMine ? 'mr-12' : 'ml-12'}`}>
                {m.created_at ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(m.created_at)) : ''}
              </span>
            </motion.div>
          );
        })}
        </AnimatePresence>
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-vyre-muted font-pixel text-xs tracking-widest uppercase opacity-50">
            <div>No messages yet</div>
            <div className="text-[10px] mt-2">Start the conversation</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-vyre-card border-t border-vyre-border relative z-10">
        {replyTo && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center justify-between bg-vyre-secondary px-4 py-2 rounded-t-xl border-l-2 border-vyre-accent mb-[-12px] pb-5 z-0 relative"
          >
            <div className="flex items-center text-xs text-vyre-muted">
              <Reply size={12} className="mr-2 text-vyre-accent -scale-x-100" />
              Replying to <span className="font-pixel font-bold text-vyre-text ml-1 mr-2 tracking-widest uppercase">{replyTo.username || replyTo.display_name}</span>
            </div>
            <button onClick={() => setReplyTo(null)} className="text-vyre-muted hover:text-vyre-text transition-colors">
              <X size={14} />
            </button>
          </motion.div>
        )}
        <form onSubmit={sendMessage} className="relative z-10 mt-1">
          <div className="flex items-center bg-vyre-bg rounded-xl overflow-hidden border border-vyre-border focus-within:border-vyre-accent transition-colors">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-vyre-text px-4 py-3 text-sm focus:outline-none placeholder:text-vyre-muted"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2 mr-2 text-vyre-bg bg-vyre-accent rounded-lg disabled:opacity-50 disabled:bg-vyre-secondary disabled:text-vyre-muted transition-all hover:-translate-y-[1px] shadow-[0_2px_8px_rgba(16,185,129,0.2)] disabled:shadow-none"
            >
              <Send size={16} className={input.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}