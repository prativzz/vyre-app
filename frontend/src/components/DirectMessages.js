import React, { useEffect, useState, useRef } from 'react';
import { API_URL } from '../config';
import { Send, Reply, X, Trash2 } from 'lucide-react';

export default function DirectMessages({ friend, token, socket, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
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
        {messages.map((m) => {
          const isMine = m.sender_id === user.id;
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
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-300 shadow-sm">
                  {getInitial(m.display_name || m.username)}
                </div>
                
                {/* Message Bubble */}
                <div className={`relative px-4 py-2 rounded-2xl shadow-md text-[15px] leading-relaxed break-words
                  ${isMine 
                    ? 'bg-blue-600 text-white rounded-br-sm' 
                    : 'bg-gray-700 text-gray-100 rounded-bl-sm'
                  }`}
                >
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
                  {isMine && (
                    <button 
                      onClick={() => deleteMessage(m.id)}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-full transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <span className={`text-[11px] text-gray-500 mt-1 ${isMine ? 'mr-12' : 'ml-12'}`}>
                {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(m.createdAt))}
              </span>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-gray-500 italic">
            Say hi to {friend.display_name || friend.username}!
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-900/80 backdrop-blur-sm border-t border-gray-800">
        {replyTo && (
          <div className="flex items-center justify-between bg-gray-800/80 px-4 py-2 rounded-t-xl border-l-4 border-blue-500 shadow-sm mb-[-8px] pb-4">
            <div className="flex items-center text-sm text-gray-300">
              <Reply size={14} className="mr-2 text-blue-400 -scale-x-100" />
              Replying to <span className="font-semibold text-white ml-1 mr-2">{replyTo.username}</span>
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
              placeholder={`Message @${friend.username}`}
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
