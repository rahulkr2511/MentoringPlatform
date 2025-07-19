import React, { useState, useEffect, useRef } from 'react';
import '../styles/Dashboard.css';

const Chat = ({ 
  sessionId, 
  participantName, 
  isMentor = false 
}) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'System',
      text: 'Session started. You can now chat with your ' + (isMentor ? 'mentee' : 'mentor') + '.',
      timestamp: new Date(),
      isSystem: true
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      sender: isMentor ? 'Mentor' : 'Mentee',
      text: newMessage.trim(),
      timestamp: new Date(),
      isSystem: false
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    
    // Simulate typing indicator from other participant
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      // Simulate response (in real app, this would come from WebSocket)
      const response = {
        id: Date.now() + 1,
        sender: isMentor ? 'Mentee' : 'Mentor',
        text: 'Thanks for your message! I\'ll get back to you shortly.',
        timestamp: new Date(),
        isSystem: false
      };
      setMessages(prev => [...prev, response]);
    }, 2000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h4>Chat with {participantName || (isMentor ? 'Mentee' : 'Mentor')}</h4>
        <div className="chat-status">
          <span className="status-indicator online"></span>
          <span>Online</span>
        </div>
      </div>
      
      <div className="chat-messages">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`chat-message ${message.isSystem ? 'system-message' : ''} ${
              message.sender === (isMentor ? 'Mentor' : 'Mentee') ? 'own-message' : 'other-message'
            }`}
          >
            {!message.isSystem && (
              <div className="message-sender">
                {message.sender}
              </div>
            )}
            <div className="message-content">
              <span className="message-text">{message.text}</span>
              <span className="message-time">
                {formatTime(message.timestamp)}
              </span>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="chat-message other-message typing-indicator">
            <div className="message-content">
              <span className="message-text">
                <span className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
                {isMentor ? 'Mentee' : 'Mentor'} is typing...
              </span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input">
        <div className="input-container">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="chat-input-field"
            rows="1"
          />
          <button 
            className="btn btn-primary send-button"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat; 