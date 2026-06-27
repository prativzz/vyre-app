import { API_URL } from '../config';
import React, { useState, useEffect, useRef } from 'react';
import { Send, Reply, X } from 'lucide-react';

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
        {messages.map((m) => {
          const isMine = isOwnMessage(m);
          return (
            <div key={m.id} id={`msg-${m.id}`} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} group`}>
              
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
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-300 shadow-sm overflow-hidden">
                  {m.avatar || (isMine && user?.avatar) ? (
                    <img src={m.avatar || user?.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getInitial(m.display_name || m.username)
                  )}
                </div>
                
                {/* Message Bubble */}
                <div className={`relative px-4 py-2 rounded-2xl shadow-md text-[15px] leading-relaxed break-words
                  ${isMine 
                    ? 'bg-blue-600 text-white rounded-br-sm' 
                    : 'bg-gray-700 text-gray-100 rounded-bl-sm'
                  }`}
                >
                  <div className="text-[10px] font-semibold mb-0.5 opacity-70">
                    {m.display_name || m.username}
                  </div>
                  {m.content}
                </div>
                
                {/* Hover Actions */}
                <div className={`flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${isMine ? 'mr-2' : 'ml-2'}`}>
                  <button 
                    onClick={() => setReplyTo(m)}
                    className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded-full transition-colors"
                    title="Reply"
                  >
                    <Reply size={14} className="-scale-x-100" />
                  </button>
                </div>
              </div>
              <span className={`text-[11px] text-gray-500 mt-1 ${isMine ? 'mr-12' : 'ml-12'}`}>
                {m.created_at ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(m.created_at)) : ''}
              </span>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-gray-500 italic">
            No messages yet. Be the first to say hello!
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-900/80 backdrop-blur-sm border-t border-gray-800">
        {replyTo && (
          <div className="flex items-center justify-between bg-gray-800/80 px-4 py-2 rounded-t-xl border-l-4 border-blue-500 shadow-sm mb-[-8px] pb-4">
            <div className="flex items-center text-sm text-gray-300">
              <Reply size={14} className="mr-2 text-blue-400 -scale-x-100" />
              Replying to <span className="font-semibold text-white ml-1 mr-2">{replyTo.username || replyTo.display_name}</span>
            </div>
            <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
        )}
        <form onSubmit={sendMessage} className="relative z-10">
          <div className="flex items-center bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-inner focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-gray-100 px-4 py-3 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-4 py-2 mr-1 text-blue-500 hover:text-blue-400 hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}