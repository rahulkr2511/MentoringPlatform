import React, { useState, useEffect } from 'react';
import { AuthService } from '../services/Services.ts';
import '../styles/Dashboard.css';

const MentorDashboard = ({ userData, onLogout }) => {
  const [user, setUser] = useState(userData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState('sessions'); // 'sessions', 'requests', 'video-call'
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [sessionRequests, setSessionRequests] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [videoCallData, setVideoCallData] = useState({
    roomId: null,
    isInCall: false
  });

  useEffect(() => {
    if (!user && !userData) {
      const storedUser = AuthService.getStoredUser();
      if (storedUser) {
        setUser(storedUser);
      } else if (AuthService.isAuthenticated()) {
        fetchCurrentUser();
      }
    }
  }, [user, userData]);

  useEffect(() => {
    if (currentView === 'sessions') {
      fetchUpcomingSessions();
    } else if (currentView === 'requests') {
      fetchSessionRequests();
    }
  }, [currentView]);

  const fetchCurrentUser = async () => {
    setIsLoading(true);
    try {
      const response = await AuthService.getCurrentUser();
      if (response.success) {
        setUser({
          username: response.data.username,
          email: response.data.email,
          roles: response.data.roles
        });
        localStorage.setItem('user', JSON.stringify({
          username: response.data.username,
          email: response.data.email,
          roles: response.data.roles
        }));
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUpcomingSessions = async () => {
    // Mock data for now - replace with actual API call
    const mockSessions = [
      {
        id: 1,
        menteeName: 'Alice Johnson',
        menteeEmail: 'alice@example.com',
        date: '2024-01-15',
        time: '18:00',
        duration: 60,
        topic: 'React Hooks and State Management',
        status: 'confirmed'
      },
      {
        id: 2,
        menteeName: 'Bob Smith',
        menteeEmail: 'bob@example.com',
        date: '2024-01-16',
        time: '19:00',
        duration: 45,
        topic: 'Node.js Backend Development',
        status: 'confirmed'
      },
      {
        id: 3,
        menteeName: 'Carol Davis',
        menteeEmail: 'carol@example.com',
        date: '2024-01-17',
        time: '20:00',
        duration: 90,
        topic: 'Database Design and Optimization',
        status: 'pending'
      }
    ];
    setUpcomingSessions(mockSessions);
  };

  const fetchSessionRequests = async () => {
    // Mock data for now - replace with actual API call
    const mockRequests = [
      {
        id: 4,
        menteeName: 'David Wilson',
        menteeEmail: 'david@example.com',
        requestedDate: '2024-01-18',
        requestedTime: '17:00',
        duration: 60,
        topic: 'Machine Learning Basics',
        message: 'I\'m a beginner in ML and would love to learn the fundamentals.',
        status: 'pending'
      },
      {
        id: 5,
        menteeName: 'Eva Brown',
        menteeEmail: 'eva@example.com',
        requestedDate: '2024-01-19',
        requestedTime: '18:30',
        duration: 45,
        topic: 'API Design Best Practices',
        message: 'Looking for guidance on designing RESTful APIs.',
        status: 'pending'
      }
    ];
    setSessionRequests(mockRequests);
  };

  const handleLogout = () => {
    AuthService.logout();
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = '/';
    }
  };

  const handleStartSession = (session) => {
    setSelectedSession(session);
    const roomId = `session_${session.id}_${Date.now()}`;
    setVideoCallData({ roomId, isInCall: true });
    setCurrentView('video-call');
  };

  const handleAcceptRequest = (requestId) => {
    // Mock implementation - replace with actual API call
    setSessionRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'accepted' }
          : req
      )
    );
  };

  const handleRejectRequest = (requestId) => {
    // Mock implementation - replace with actual API call
    setSessionRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'rejected' }
          : req
      )
    );
  };

  const renderUpcomingSessions = () => (
    <div className="dashboard-content">
      <div className="dashboard-card">
        <h3>Upcoming Sessions</h3>
        <div className="sessions-list">
          {upcomingSessions.map(session => (
            <div key={session.id} className="session-card">
              <div className="session-header">
                <h4>Session with {session.menteeName}</h4>
                <span className={`session-status ${session.status}`}>
                  {session.status}
                </span>
              </div>
              <div className="session-details">
                <p><strong>Date:</strong> {session.date} at {session.time}</p>
                <p><strong>Duration:</strong> {session.duration} minutes</p>
                <p><strong>Topic:</strong> {session.topic}</p>
                <p><strong>Mentee:</strong> {session.menteeEmail}</p>
              </div>
              <div className="session-actions">
                {session.status === 'confirmed' && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleStartSession(session)}
                  >
                    Start Session
                  </button>
                )}
                <button className="btn btn-secondary">Reschedule</button>
                <button className="btn btn-secondary">Cancel</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSessionRequests = () => (
    <div className="dashboard-content">
      <div className="dashboard-card">
        <h3>Session Requests</h3>
        <div className="requests-list">
          {sessionRequests.map(request => (
            <div key={request.id} className="request-card">
              <div className="request-header">
                <h4>Request from {request.menteeName}</h4>
                <span className={`request-status ${request.status}`}>
                  {request.status}
                </span>
              </div>
              <div className="request-details">
                <p><strong>Requested Date:</strong> {request.requestedDate} at {request.requestedTime}</p>
                <p><strong>Duration:</strong> {request.duration} minutes</p>
                <p><strong>Topic:</strong> {request.topic}</p>
                <p><strong>Mentee:</strong> {request.menteeEmail}</p>
                <p><strong>Message:</strong> {request.message}</p>
              </div>
              {request.status === 'pending' && (
                <div className="request-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleAcceptRequest(request.id)}
                  >
                    Accept
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => handleRejectRequest(request.id)}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderVideoCall = () => (
    <div className="video-call-container">
      <div className="video-call-header">
        <h3>Video Session with {selectedSession?.menteeName}</h3>
        <button 
          className="btn btn-secondary"
          onClick={() => setCurrentView('sessions')}
        >
          End Call
        </button>
      </div>
      
      <div className="video-call-content">
        <div className="video-streams">
          <div className="video-stream">
            <div className="video-placeholder">
              <p>Your Video Stream</p>
              <p>Camera and microphone access required</p>
            </div>
            <div className="video-controls">
              <button className="btn btn-secondary">🎤</button>
              <button className="btn btn-secondary">📹</button>
              <button className="btn btn-secondary">📞</button>
            </div>
          </div>
          
          <div className="video-stream">
            <div className="video-placeholder">
              <p>Mentee Video Stream</p>
              <p>Waiting for mentee to join...</p>
            </div>
          </div>
        </div>
        
        <div className="chat-panel">
          <div className="chat-header">
            <h4>Chat</h4>
          </div>
          <div className="chat-messages">
            <div className="chat-message">
              <span className="message-sender">System:</span>
              <span className="message-text">Session started. You can now chat with your mentee.</span>
            </div>
          </div>
          <div className="chat-input">
            <input 
              type="text" 
              placeholder="Type your message..."
              className="chat-input-field"
            />
            <button className="btn btn-primary">Send</button>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-card">
          <h2>Loading...</h2>
          <p>Please wait while we load your dashboard.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-card">
          <h2>Access Denied</h2>
          <p>Please log in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>👨‍🏫 Mentor Command Center</h1>
          <p>Welcome back, {user.username}! Inspire and guide the next generation.</p>
        </div>
        <div className="dashboard-actions">
          <div className="action-buttons">
            <button 
              className="btn btn-secondary"
              onClick={() => setCurrentView('sessions')}
              disabled={currentView === 'sessions'}
            >
              📅 Upcoming Sessions
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setCurrentView('requests')}
              disabled={currentView === 'requests'}
            >
              📋 Session Requests
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setCurrentView('video-call')}
              disabled={currentView === 'video-call'}
            >
              📹 Active Sessions
            </button>
            <button onClick={handleLogout} className="btn btn-logout">
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      {currentView === 'sessions' && renderUpcomingSessions()}
      {currentView === 'requests' && renderSessionRequests()}
      {currentView === 'video-call' && renderVideoCall()}
    </div>
  );
};

export default MentorDashboard; 