import React, { useState, useEffect, useRef } from 'react';
import '../styles/Dashboard.css';

// Import services
import { AuthService } from '../services/Services.ts';
import { chatService } from '../services/ChatService.ts';

const Chat = ({ 
  sessionId, 
  participantName, 
  isMentor = false,
  currentUsername = null, // Add optional prop for current username
  sessionData = null // Add session data for user determination
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
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Connect to chat service when component mounts
  useEffect(() => {
    console.log('Chat component mounted with sessionId:', sessionId);
    if (sessionId) {
      const connectToChat = async () => {
        try {
          // Force refresh user data by clearing any cached data and re-reading from localStorage
          const currentUser = AuthService.getStoredUser();
          console.log('Current user for chat:', currentUser);
          
          // Additional validation - check if the user data makes sense for this session
          if (currentUser && currentUser.username) {
            console.log('Connecting to chat with sessionId:', sessionId, 'username:', currentUser.username);
            const connected = await chatService.connect(sessionId, currentUser.username);
            console.log('Chat connection result:', connected);
            setIsConnected(connected);
            
            if (connected) {
              // Set up message handler
              chatService.setOnMessageReceived((message) => {
                console.log('Chat received message:', message);
                const newMessageObj = {
                  id: Date.now(),
                  sender: message.sender,
                  text: message.content,
                  timestamp: new Date(message.timestamp),
                  isSystem: false
                };
                console.log('Adding message to state:', newMessageObj);
                setMessages(prev => [...prev, newMessageObj]);
              });
            }
          } else {
            console.error('No current user found for chat');
          }
        } catch (error) {
          console.error('Error connecting to chat:', error);
        }
      };
      
      connectToChat();
    } else {
      console.error('No sessionId provided to Chat component');
    }

    // Cleanup on unmount
    return () => {
      console.log('Chat component unmounting, disconnecting...');
      chatService.disconnect();
    };
  }, [sessionId]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !isConnected) return;

    // Send message via WebSocket
    const sent = chatService.sendMessage(newMessage.trim());
    if (sent) {
      setNewMessage('');
    } else {
      console.error('Failed to send message');
    }
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
          <span className={`status-indicator ${isConnected ? 'online' : 'offline'}`}></span>
          <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
        </div>
      </div>
      
      <div className="chat-messages">
        {messages.map((message) => {
          // Force refresh user data from localStorage to ensure we have the correct current user
          const currentUser = AuthService.getStoredUser();
          
          // Use the prop if provided, otherwise fall back to stored user
          let actualCurrentUser = currentUsername ? { username: currentUsername } : currentUser;
          
          // Additional safety check - if we're in mentee dashboard but current user is mentor, 
          // or vice versa, use the session data to determine the correct user
          if (!actualCurrentUser || !actualCurrentUser.username) {
            console.warn('No current user found, using session context');
            // Try to determine user from session context
            if (sessionData) {
              if (isMentor && sessionData.mentorUsername) {
                actualCurrentUser = { username: sessionData.mentorUsername };
              } else if (!isMentor && sessionData.menteeUsername) {
                actualCurrentUser = { username: sessionData.menteeUsername };
              }
            }
          }
          
          // Final safety check - if the current user doesn't match the expected role
          // (e.g., mentee dashboard showing mentor user), use session data
          if (actualCurrentUser && actualCurrentUser.username && sessionData) {
            const expectedUsername = isMentor ? sessionData.mentorUsername : sessionData.menteeUsername;
            if (expectedUsername && actualCurrentUser.username !== expectedUsername) {
              console.warn('User mismatch detected, using session data:', {
                currentUser: actualCurrentUser.username,
                expectedUser: expectedUsername,
                isMentor
              });
              actualCurrentUser = { username: expectedUsername };
            }
          }
          
          // Debug the user retrieval
          console.log('User retrieval debug:', {
            storedUser: currentUser,
            propUsername: currentUsername,
            actualCurrentUser,
            sessionId,
            isMentor,
            participantName,
            sessionData: sessionData ? {
              mentorUsername: sessionData.mentorUsername,
              menteeUsername: sessionData.menteeUsername
            } : null
          });
          
          const isOwnMessage = message.sender === actualCurrentUser?.username;
          
          console.log('Message display debug:', {
            messageSender: message.sender,
            currentUsername: actualCurrentUser?.username,
            isOwnMessage,
            messageText: message.text,
            comparison: `${message.sender} === ${actualCurrentUser?.username} = ${message.sender === actualCurrentUser?.username}`
          });
          
          return (
            <div 
              key={message.id} 
              className={`chat-message ${message.isSystem ? 'system-message' : ''} ${
                isOwnMessage ? 'own-message' : 'other-message'
              }`}
            >
              {!message.isSystem && (
                <div className="message-sender">
                  {isOwnMessage ? 'You' : message.sender}
                </div>
              )}
              <div className="message-content">
                <span className="message-text">{message.text}</span>
                <span className="message-time">
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
          );
        })}
        

        
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
            disabled={!newMessage.trim() || !isConnected}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat; 