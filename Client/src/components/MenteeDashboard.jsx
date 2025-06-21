import React, { useState, useEffect } from 'react';
import { AuthService, MentorService } from '../services/Services.ts';
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
  const [filteredMentors, setFilteredMentors] = useState([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [videoCallData, setVideoCallData] = useState({
    roomId: null,
    isInCall: false
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

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

  const fetchMentors = async () => {
    setIsLoading(true);
    try {
      const response = await MentorService.getAllMentors();
      if (response.success && response.data) {
        // Transform the API response to match the expected format
        const transformedMentors = response.data.map(mentor => ({
          id: mentor.id,
          username: mentor.username,
          name: mentor.name || mentor.username, // Use username as fallback if name is null
          expertise: mentor.expertise || 'Not specified',
          rating: 4.5, // Default rating since it's not in the API response yet
          availability: mentor.availability || 'Not specified',
          bio: mentor.description || 'No description available',
          hourlyRate: mentor.hourlyRate || 0,
          email: mentor.email,
          enabled: mentor.enabled
        }));
        setMentors(transformedMentors);
        setFilteredMentors(transformedMentors);
      } else {
        console.error('Failed to fetch mentors:', response.error);
        setMentors([]);
        setFilteredMentors([]);
      }
    } catch (error) {
      console.error('Error fetching mentors:', error);
      setMentors([]);
      setFilteredMentors([]);
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

  // Apply filters to mentors whenever filters or mentors change
  useEffect(() => {
    setIsFiltering(true);
    const filtered = mentors.filter(mentor => {
      if (debouncedFilters.expertise && !mentor.expertise.toLowerCase().includes(debouncedFilters.expertise.toLowerCase())) {
        return false;
      }
      if (debouncedFilters.availability && !mentor.availability.toLowerCase().includes(debouncedFilters.availability.toLowerCase())) {
        return false;
      }
      if (debouncedFilters.rating && mentor.rating < parseFloat(debouncedFilters.rating)) {
        return false;
      }
      return true;
    });
    setFilteredMentors(filtered);
    setIsFiltering(false);
  }, [debouncedFilters, mentors]);

  // Debounce filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [filters]);

  const renderMentorListing = () => (
    <div className="dashboard-content">
      <div className="dashboard-card">
        <h3>Find Your Mentor</h3>
        <div className="mentor-count">
          <p>Found {filteredMentors.length} mentor{filteredMentors.length !== 1 ? 's' : ''}</p>
        </div>
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
        {isFiltering ? (
          <div className="no-mentors">
            <p>Applying filters...</p>
          </div>
        ) : filteredMentors.length === 0 ? (
          <div className="no-mentors">
            <p>No mentors found matching your criteria.</p>
          </div>
        ) : (
          filteredMentors.map(mentor => (
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
                  disabled={!mentor.enabled}
                >
                  {mentor.enabled ? 'Book Session' : 'Not Available'}
                </button>
                <button className="btn btn-secondary">View Profile</button>
              </div>
            </div>
          ))
        )}
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