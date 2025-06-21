import React, { useState, useEffect } from 'react';
import { AuthService, SessionService } from '../services/Services.ts';
import '../styles/Dashboard.css';

const MentorDashboard = ({ userData, onLogout }) => {
  const [user, setUser] = useState(userData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState('sessions'); // 'sessions', 'video-call'
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [videoCallData, setVideoCallData] = useState({
    roomId: null,
    isInCall: false
  });

  useEffect(() => {
    if (currentView === 'sessions') {
      fetchSessions();
    }
  }, [currentView]);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const [upcomingResponse, historyResponse] = await Promise.all([
        SessionService.getUpcomingSessions(),
        SessionService.getSessionHistory()
      ]);

      if (upcomingResponse.success && upcomingResponse.data) {
        setUpcomingSessions(upcomingResponse.data);
      } else {
        console.error('Failed to fetch upcoming sessions:', upcomingResponse.error);
        setUpcomingSessions([]);
      }

      if (historyResponse.success && historyResponse.data) {
        setSessionHistory(historyResponse.data);
      } else {
        console.error('Failed to fetch session history:', historyResponse.error);
        setSessionHistory([]);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setUpcomingSessions([]);
      setSessionHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = '/';
    }
  };

  const handleUpdateSessionStatus = async (sessionId, status) => {
    setIsLoading(true);
    try {
      const response = await SessionService.updateSessionStatus(sessionId, status);
      if (response.success) {
        alert(`Session ${status.toLowerCase()} successfully!`);
        fetchSessions();
      } else {
        alert('Failed to update session status: ' + response.error);
      }
    } catch (error) {
      console.error('Error updating session status:', error);
      alert('Failed to update session status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSession = async (sessionId) => {
    if (!confirm('Are you sure you want to cancel this session?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await SessionService.cancelSession(sessionId);
      if (response.success) {
        alert('Session cancelled successfully!');
        fetchSessions();
      } else {
        alert('Failed to cancel session: ' + response.error);
      }
    } catch (error) {
      console.error('Error cancelling session:', error);
      alert('Failed to cancel session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSession = (session) => {
    // Generate a room ID for the video call
    const roomId = `session_${session.id}_${Date.now()}`;
    setVideoCallData({ roomId, isInCall: true });
    setCurrentView('video-call');
  };

  const renderSessions = () => (
    <div className="dashboard-content">
      <div className="dashboard-card">
        <h3>Session Management</h3>
        <div className="sessions-summary">
          <div className="summary-item">
            <span className="summary-number">{upcomingSessions.length}</span>
            <span className="summary-label">Upcoming Sessions</span>
          </div>
          <div className="summary-item">
            <span className="summary-number">{sessionHistory.length}</span>
            <span className="summary-label">Past Sessions</span>
          </div>
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div className="sessions-section">
        <h4>Upcoming Sessions</h4>
        <div className="sessions-grid">
          {upcomingSessions.length === 0 ? (
            <div className="no-sessions">
              <p>No upcoming sessions scheduled.</p>
            </div>
          ) : (
            upcomingSessions.map(session => (
              <div key={session.id} className="session-card">
                <div className="session-header">
                  <h4>Session with {session.menteeName}</h4>
                  <div className={`session-status ${session.status.toLowerCase()}`}>
                    {session.status}
                  </div>
                </div>
                <div className="session-info">
                  <p><strong>Date:</strong> {new Date(session.scheduledDateTime).toLocaleDateString()}</p>
                  <p><strong>Time:</strong> {new Date(session.scheduledDateTime).toLocaleTimeString()}</p>
                  <p><strong>Duration:</strong> {session.durationMinutes} minutes</p>
                  <p><strong>Type:</strong> {session.sessionType}</p>
                  {session.notes && <p><strong>Notes:</strong> {session.notes}</p>}
                </div>
                <div className="session-actions">
                  {session.status === 'PENDING' && (
                    <>
                      <button 
                        className="btn btn-success"
                        onClick={() => handleUpdateSessionStatus(session.id, 'CONFIRMED')}
                      >
                        Confirm
                      </button>
                      <button 
                        className="btn btn-danger"
                        onClick={() => handleUpdateSessionStatus(session.id, 'REJECTED')}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {session.status === 'CONFIRMED' && (
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleJoinSession(session)}
                    >
                      Join Session
                    </button>
                  )}
                  <button 
                    className="btn btn-secondary"
                    onClick={() => handleCancelSession(session.id)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Session History */}
      <div className="sessions-section">
        <h4>Session History</h4>
        <div className="sessions-grid">
          {sessionHistory.length === 0 ? (
            <div className="no-sessions">
              <p>No past sessions found.</p>
            </div>
          ) : (
            sessionHistory.map(session => (
              <div key={session.id} className="session-card">
                <div className="session-header">
                  <h4>Session with {session.menteeName}</h4>
                  <div className={`session-status ${session.status.toLowerCase()}`}>
                    {session.status}
                  </div>
                </div>
                <div className="session-info">
                  <p><strong>Date:</strong> {new Date(session.scheduledDateTime).toLocaleDateString()}</p>
                  <p><strong>Time:</strong> {new Date(session.scheduledDateTime).toLocaleTimeString()}</p>
                  <p><strong>Duration:</strong> {session.durationMinutes} minutes</p>
                  <p><strong>Type:</strong> {session.sessionType}</p>
                  {session.notes && <p><strong>Notes:</strong> {session.notes}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderVideoCall = () => (
    <div className="dashboard-content">
      <div className="dashboard-card">
        <h3>Video Call Session</h3>
        <div className="video-call-info">
          <p><strong>Room ID:</strong> {videoCallData.roomId}</p>
          <p><strong>Status:</strong> Active</p>
        </div>
        <div className="video-call-actions">
          <button 
            className="btn btn-danger"
            onClick={() => {
              setVideoCallData({ roomId: null, isInCall: false });
              setCurrentView('sessions');
            }}
          >
            End Call
          </button>
        </div>
      </div>
      <div className="video-call-placeholder">
        <div className="video-container">
          <div className="video-placeholder">
            <h4>Video Call Interface</h4>
            <p>Video call functionality would be integrated here</p>
            <p>Room: {videoCallData.roomId}</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h2>Mentor Dashboard</h2>
          <p>Welcome back, {user?.name || 'Mentor'}! 👨‍🏫</p>
        </div>
        <div className="dashboard-actions">
          <div className="action-buttons">
            <button 
              className={`btn btn-secondary ${currentView === 'sessions' ? 'active' : ''}`}
              onClick={() => setCurrentView('sessions')}
            >
              📅 Manage Sessions
            </button>
            <button 
              className={`btn btn-secondary ${currentView === 'video-call' ? 'active' : ''}`}
              onClick={() => setCurrentView('video-call')}
            >
              📹 Active Sessions
            </button>
            <button onClick={handleLogout} className="btn btn-logout">
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      {currentView === 'sessions' ? renderSessions() : renderVideoCall()}
    </div>
  );
};

export default MentorDashboard; 