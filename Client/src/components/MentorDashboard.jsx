import React, { useState, useEffect } from 'react';
import { AuthService, SessionService, ProfileService } from '../services/Services.ts';
import '../styles/Dashboard.css';

const MentorDashboard = ({ userData, onLogout }) => {
  const [user, setUser] = useState(userData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState('sessions'); // 'sessions', 'video-call', 'profile'
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [videoCallData, setVideoCallData] = useState({
    roomId: null,
    isInCall: false
  });
  
  // Profile state
  const [profile, setProfile] = useState({
    name: '',
    expertise: '',
    availability: '',
    hourlyRate: 0,
    description: ''
  });
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  // Fetch current user data
  const fetchCurrentUser = async () => {
    try {
      // First check if user data is stored in localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        return;
      }

      // If no stored user, fetch from API
      const token = localStorage.getItem('token');
      if (token) {
        const response = await AuthService.getCurrentUser();
        if (response.success && response.data) {
          setUser(response.data);
          // Store user data in localStorage for future use
          localStorage.setItem('user', JSON.stringify(response.data));
        } else {
          console.error('Failed to fetch current user:', response.error);
        }
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  useEffect(() => {
    // Fetch current user on component mount if not provided
    if (!user && !userData) {
      fetchCurrentUser();
    }
  }, []);

  useEffect(() => {
    if (currentView === 'sessions') {
      fetchSessions();
    } else if (currentView === 'profile') {
      fetchProfile();
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

  // Profile management functions
  const fetchProfile = async () => {
    setIsProfileLoading(true);
    try {
      const response = await ProfileService.getProfile();
      if (response.success && response.data) {
        setProfile({
          name: response.data.name || '',
          expertise: response.data.expertise || '',
          availability: response.data.availability || '',
          hourlyRate: response.data.hourlyRate || 0,
          description: response.data.description || ''
        });
      } else {
        console.error('Failed to fetch profile:', response.error);
        // Initialize with empty values if no profile exists
        setProfile({
          name: '',
          expertise: '',
          availability: '',
          hourlyRate: 0,
          description: ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile({
        name: '',
        expertise: '',
        availability: '',
        hourlyRate: 0,
        description: ''
      });
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleProfileChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field-specific error when user starts typing
    if (profileErrors[field]) {
      setProfileErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateProfile = () => {
    const errors = {};
    
    if (!profile.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!profile.expertise.trim()) {
      errors.expertise = 'Expertise is required';
    }
    
    if (!profile.availability.trim()) {
      errors.availability = 'Availability is required';
    }
    
    if (profile.hourlyRate <= 0) {
      errors.hourlyRate = 'Hourly rate must be greater than 0';
    }
    
    if (!profile.description.trim()) {
      errors.description = 'Description is required';
    }
    
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = async () => {
    if (!validateProfile()) {
      return;
    }

    setIsProfileLoading(true);
    try {
      const response = await ProfileService.updateProfile(profile);
      if (response.success) {
        // eslint-disable-next-line no-restricted-globals
        alert('Profile updated successfully!');
        setShowProfileModal(false);
        setProfileErrors({});
      } else {
        // eslint-disable-next-line no-restricted-globals
        alert('Failed to update profile: ' + response.error);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      // eslint-disable-next-line no-restricted-globals
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsProfileLoading(false);
    }
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

  const renderProfile = () => (
    <div className="dashboard-content">
      <div className="dashboard-card">
        <h3>Profile Management</h3>
        <p>Update your mentor profile to help mentees find you and understand your expertise.</p>
        <button 
          className="btn btn-primary"
          onClick={() => {
            fetchProfile();
            setShowProfileModal(true);
          }}
        >
          Edit Profile
        </button>
      </div>
      
      {/* Current Profile Display */}
      <div className="profile-display">
        <h4>Current Profile</h4>
        <div className="profile-info">
          <p><strong>Name</strong><span className="profile-value">{profile.name || 'Not set'}</span></p>
          <p><strong>Expertise</strong><span className="profile-value">{profile.expertise || 'Not set'}</span></p>
          <p><strong>Availability</strong><span className="profile-value">{profile.availability || 'Not set'}</span></p>
          <p><strong>Hourly Rate</strong><span className="profile-value">${profile.hourlyRate || 'Not set'}</span></p>
          <p><strong>Description</strong><span className="profile-value">{profile.description || 'Not set'}</span></p>
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
          <p>Welcome back, {user?.username || 'Mentor'}!</p>
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
              className={`btn btn-secondary ${currentView === 'profile' ? 'active' : ''}`}
              onClick={() => setCurrentView('profile')}
            >
              👤 Profile
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

      {currentView === 'sessions' ? renderSessions() : currentView === 'video-call' ? renderVideoCall() : renderProfile()}
      
      {/* Profile Modal */}
      {showProfileModal && (
        <div className="modal-overlay">
          <div className="profile-modal">
            <div className="modal-header">
              <h3>Edit Profile</h3>
              <button 
                className="modal-close"
                onClick={() => setShowProfileModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label>Full Name:</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => handleProfileChange('name', e.target.value)}
                  className={profileErrors.name ? 'error' : ''}
                  placeholder="Enter your full name"
                  disabled={isProfileLoading}
                />
                {profileErrors.name && <span className="error-message">{profileErrors.name}</span>}
              </div>
              
              <div className="form-group">
                <label>Expertise:</label>
                <input
                  type="text"
                  value={profile.expertise}
                  onChange={(e) => handleProfileChange('expertise', e.target.value)}
                  className={profileErrors.expertise ? 'error' : ''}
                  placeholder="e.g., Software Development, Data Science"
                  disabled={isProfileLoading}
                />
                {profileErrors.expertise && <span className="error-message">{profileErrors.expertise}</span>}
              </div>
              
              <div className="form-group">
                <label>Availability:</label>
                <input
                  type="text"
                  value={profile.availability}
                  onChange={(e) => handleProfileChange('availability', e.target.value)}
                  className={profileErrors.availability ? 'error' : ''}
                  placeholder="e.g., Weekdays 9 AM - 5 PM, Weekends 10 AM - 4 PM"
                  disabled={isProfileLoading}
                />
                {profileErrors.availability && <span className="error-message">{profileErrors.availability}</span>}
              </div>
              
              <div className="form-group">
                <label>Hourly Rate ($):</label>
                <input
                  type="number"
                  value={profile.hourlyRate}
                  onChange={(e) => handleProfileChange('hourlyRate', parseFloat(e.target.value) || 0)}
                  className={profileErrors.hourlyRate ? 'error' : ''}
                  placeholder="50"
                  min="0"
                  step="0.01"
                  disabled={isProfileLoading}
                />
                {profileErrors.hourlyRate && <span className="error-message">{profileErrors.hourlyRate}</span>}
              </div>
              
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={profile.description}
                  onChange={(e) => handleProfileChange('description', e.target.value)}
                  className={profileErrors.description ? 'error' : ''}
                  placeholder="Tell mentees about your experience, background, and what you can help them with..."
                  rows={4}
                  disabled={isProfileLoading}
                />
                {profileErrors.description && <span className="error-message">{profileErrors.description}</span>}
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowProfileModal(false)}
                disabled={isProfileLoading}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleProfileSubmit}
                disabled={isProfileLoading}
              >
                {isProfileLoading ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorDashboard; 