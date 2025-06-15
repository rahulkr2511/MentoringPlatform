import React, { useState, useEffect } from 'react';
import { AuthService, ProfileService } from '../services/Services.ts';
import '../styles/Dashboard.css';

const MentorDashboard = ({ userData, onLogout }) => {
  const [user, setUser] = useState(userData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState('sessions'); // 'sessions', 'requests', 'video-call', 'profile'
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [sessionRequests, setSessionRequests] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [videoCallData, setVideoCallData] = useState({
    roomId: null,
    isInCall: false
  });
  const [profileData, setProfileData] = useState({
    name: '',
    expertise: '',
    availability: '',
    hourlyRate: '',
    description: ''
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

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
    } else if (currentView === 'profile') {
      fetchProfileData();
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

  const fetchProfileData = async () => {
    try {
      const response = await ProfileService.getProfile();
      if (response.success && response.data) {
        setProfileData({
          name: response.data.name || '',
          expertise: response.data.expertise || '',
          availability: response.data.availability || '',
          hourlyRate: response.data.hourlyRate ? response.data.hourlyRate.toString() : '',
          description: response.data.description || ''
        });
      } else {
        console.error('Failed to fetch profile:', response.error);
        // Set default empty values if profile doesn't exist
        setProfileData({
          name: '',
          expertise: '',
          availability: '',
          hourlyRate: '',
          description: ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      // Set default empty values on error
      setProfileData({
        name: '',
        expertise: '',
        availability: '',
        hourlyRate: '',
        description: ''
      });
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

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field-specific error when user starts typing
    if (profileErrors[name]) {
      setProfileErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateProfileForm = () => {
    const newErrors = {};
    
    if (!profileData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!profileData.expertise.trim()) {
      newErrors.expertise = 'Expertise is required';
    }
    
    if (!profileData.availability.trim()) {
      newErrors.availability = 'Availability is required';
    }
    
    if (!profileData.hourlyRate) {
      newErrors.hourlyRate = 'Hourly rate is required';
    } else if (isNaN(profileData.hourlyRate) || parseFloat(profileData.hourlyRate) <= 0) {
      newErrors.hourlyRate = 'Please enter a valid hourly rate';
    }
    
    if (!profileData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    setProfileErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (validateProfileForm()) {
      setIsProfileLoading(true);
      try {
        const profileRequest = {
          name: profileData.name.trim(),
          expertise: profileData.expertise.trim(),
          availability: profileData.availability.trim(),
          hourlyRate: parseFloat(profileData.hourlyRate),
          description: profileData.description.trim()
        };

        const response = await ProfileService.updateProfile(profileRequest);
        
        if (response.success) {
          setProfileSuccess(true);
          setProfileErrors({});
          
          // Update the profile data with the response
          if (response.data) {
            setProfileData({
              name: response.data.name || profileData.name,
              expertise: response.data.expertise || profileData.expertise,
              availability: response.data.availability || profileData.availability,
              hourlyRate: response.data.hourlyRate ? response.data.hourlyRate.toString() : profileData.hourlyRate,
              description: response.data.description || profileData.description
            });
          }
          
          // Hide success message after 3 seconds
          setTimeout(() => {
            setProfileSuccess(false);
          }, 3000);
        } else {
          setProfileErrors({ general: response.error || 'Failed to update profile. Please try again.' });
        }
        
      } catch (error) {
        console.error('Error updating profile:', error);
        setProfileErrors({ general: 'Failed to update profile. Please try again.' });
      } finally {
        setIsProfileLoading(false);
      }
    }
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

  const renderProfileUpdate = () => (
    <div className="dashboard-content">
      <div className="dashboard-card">
        <h3>Update Your Profile</h3>
        <p className="profile-subtitle">Keep your profile information up to date to attract more mentees.</p>
        
        {profileErrors.general && (
          <div className="error-message general-error">
            {profileErrors.general}
          </div>
        )}
        
        {profileSuccess && (
          <div className="success-message">
            ✅ Profile updated successfully!
          </div>
        )}
        
        <form onSubmit={handleProfileSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={profileData.name}
              onChange={handleProfileChange}
              className={profileErrors.name ? 'error' : ''}
              placeholder="Enter your full name"
              disabled={isProfileLoading}
            />
            {profileErrors.name && <span className="error-message">{profileErrors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="hourlyRate">Hourly Rate ($)</label>
            <input
              type="number"
              id="hourlyRate"
              name="hourlyRate"
              value={profileData.hourlyRate}
              onChange={handleProfileChange}
              className={profileErrors.hourlyRate ? 'error' : ''}
              placeholder="50"
              min="1"
              disabled={isProfileLoading}
            />
            {profileErrors.hourlyRate && <span className="error-message">{profileErrors.hourlyRate}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="expertise">Areas of Expertise</label>
            <input
              type="text"
              id="expertise"
              name="expertise"
              value={profileData.expertise}
              onChange={handleProfileChange}
              className={profileErrors.expertise ? 'error' : ''}
              placeholder="e.g., Software Development, React, Node.js, Data Science"
              disabled={isProfileLoading}
            />
            {profileErrors.expertise && <span className="error-message">{profileErrors.expertise}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="availability">Availability</label>
            <input
              type="text"
              id="availability"
              name="availability"
              value={profileData.availability}
              onChange={handleProfileChange}
              className={profileErrors.availability ? 'error' : ''}
              placeholder="e.g., Weekdays 6-8 PM, Weekends 2-6 PM"
              disabled={isProfileLoading}
            />
            {profileErrors.availability && <span className="error-message">{profileErrors.availability}</span>}
          </div>

          <div className="form-group full-width">
            <label htmlFor="description">About You</label>
            <textarea
              id="description"
              name="description"
              value={profileData.description}
              onChange={handleProfileChange}
              className={profileErrors.description ? 'error' : ''}
              placeholder="Tell mentees about your experience, background, and what you can help them with..."
              rows="6"
              disabled={isProfileLoading}
            />
            {profileErrors.description && <span className="error-message">{profileErrors.description}</span>}
            <div className="character-count">
              {profileData.description.length}/500 characters
            </div>
          </div>

          <div className="form-group full-width">
            <button type="submit" className="btn btn-primary" disabled={isProfileLoading}>
              {isProfileLoading ? 'Updating Profile...' : 'Update Profile'}
            </button>
          </div>
        </form>
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
              className={`btn btn-secondary ${currentView === 'sessions' ? 'active' : ''}`}
              onClick={() => setCurrentView('sessions')}
            >
              📅 Upcoming Sessions
            </button>
            <button 
              className={`btn btn-secondary ${currentView === 'requests' ? 'active' : ''}`}
              onClick={() => setCurrentView('requests')}
            >
              📋 Session Requests
            </button>
            <button 
              className={`btn btn-secondary ${currentView === 'video-call' ? 'active' : ''}`}
              onClick={() => setCurrentView('video-call')}
            >
              📹 Active Sessions
            </button>
            <button 
              className={`btn btn-secondary ${currentView === 'profile' ? 'active' : ''}`}
              onClick={() => setCurrentView('profile')}
            >
              👤 Update Profile
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
      {currentView === 'profile' && renderProfileUpdate()}
    </div>
  );
};

export default MentorDashboard; 