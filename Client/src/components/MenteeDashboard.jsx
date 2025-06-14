import React, { useState, useEffect } from 'react';
import { AuthService } from '../services/Services.ts';
import '../styles/Dashboard.css';

const MenteeDashboard = ({ userData, onLogout }) => {
  const [user, setUser] = useState(userData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState('mentors'); // 'mentors', 'video-call'
  const [mentors, setMentors] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [filters, setFilters] = useState({
    expertise: '',
    availability: '',
    rating: ''
  });
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
    if (currentView === 'mentors') {
      fetchMentors();
    }
  }, [currentView, filters]);

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

  const fetchMentors = async () => {
    // Mock data for now - replace with actual API call
    const mockMentors = [
      {
        id: 1,
        username: 'john_mentor',
        name: 'John Smith',
        expertise: 'Software Development',
        rating: 4.8,
        availability: 'Weekdays 6-8 PM',
        bio: 'Senior software developer with 10+ years of experience in React, Node.js, and cloud technologies.',
        hourlyRate: 50
      },
      {
        id: 2,
        username: 'sarah_mentor',
        name: 'Sarah Johnson',
        expertise: 'Data Science',
        rating: 4.9,
        availability: 'Weekends 2-6 PM',
        bio: 'Data scientist specializing in machine learning, Python, and statistical analysis.',
        hourlyRate: 60
      },
      {
        id: 3,
        username: 'mike_mentor',
        name: 'Mike Chen',
        expertise: 'Product Management',
        rating: 4.7,
        availability: 'Weekdays 7-9 PM',
        bio: 'Product manager with experience in agile methodologies and user experience design.',
        hourlyRate: 45
      }
    ];
    setMentors(mockMentors);
  };

  const handleLogout = () => {
    AuthService.logout();
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = '/';
    }
  };

  const handleBookSession = (mentor) => {
    setSelectedMentor(mentor);
    // Generate a room ID for the video call
    const roomId = `session_${mentor.id}_${Date.now()}`;
    setVideoCallData({ roomId, isInCall: true });
    setCurrentView('video-call');
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const filteredMentors = mentors.filter(mentor => {
    if (filters.expertise && !mentor.expertise.toLowerCase().includes(filters.expertise.toLowerCase())) {
      return false;
    }
    if (filters.availability && !mentor.availability.toLowerCase().includes(filters.availability.toLowerCase())) {
      return false;
    }
    if (filters.rating && mentor.rating < parseFloat(filters.rating)) {
      return false;
    }
    return true;
  });

  const renderMentorListing = () => (
    <div className="dashboard-content">
      <div className="dashboard-card">
        <h3>Find Your Mentor</h3>
        <div className="filters-section">
          <div className="filter-group">
            <label>Expertise:</label>
            <input
              type="text"
              placeholder="e.g., Software Development"
              value={filters.expertise}
              onChange={(e) => handleFilterChange('expertise', e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Availability:</label>
            <input
              type="text"
              placeholder="e.g., Weekdays"
              value={filters.availability}
              onChange={(e) => handleFilterChange('availability', e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Minimum Rating:</label>
            <select
              value={filters.rating}
              onChange={(e) => handleFilterChange('rating', e.target.value)}
            >
              <option value="">Any Rating</option>
              <option value="4.5">4.5+</option>
              <option value="4.0">4.0+</option>
              <option value="3.5">3.5+</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mentors-grid">
        {filteredMentors.map(mentor => (
          <div key={mentor.id} className="mentor-card">
            <div className="mentor-header">
              <h4>{mentor.name}</h4>
              <div className="mentor-rating">
                ⭐ {mentor.rating}
              </div>
            </div>
            <div className="mentor-info">
              <p><strong>Expertise:</strong> {mentor.expertise}</p>
              <p><strong>Availability:</strong> {mentor.availability}</p>
              <p><strong>Rate:</strong> ${mentor.hourlyRate}/hour</p>
              <p className="mentor-bio">{mentor.bio}</p>
            </div>
            <div className="mentor-actions">
              <button 
                className="btn btn-primary"
                onClick={() => handleBookSession(mentor)}
              >
                Book Session
              </button>
              <button className="btn btn-secondary">View Profile</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderVideoCall = () => (
    <div className="video-call-container">
      <div className="video-call-header">
        <h3>Video Session with {selectedMentor?.name}</h3>
        <button 
          className="btn btn-secondary"
          onClick={() => setCurrentView('mentors')}
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
              <p>Mentor Video Stream</p>
              <p>Waiting for mentor to join...</p>
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
              <span className="message-text">Session started. You can now chat with your mentor.</span>
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
          <h1>🎓 Mentee Learning Hub</h1>
          <p>Welcome back, {user.username}! Ready to grow with expert guidance?</p>
        </div>
        <div className="dashboard-actions">
          <div className="action-buttons">
            <button 
              className={`btn btn-secondary ${currentView === 'mentors' ? 'active' : ''}`}
              onClick={() => setCurrentView('mentors')}
            >
              🔍 Find Mentors
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

      {currentView === 'mentors' ? renderMentorListing() : renderVideoCall()}
    </div>
  );
};

export default MenteeDashboard; 