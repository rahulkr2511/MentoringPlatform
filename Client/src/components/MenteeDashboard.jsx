import React, { useState, useEffect } from 'react';
import { AuthService, MentorService, SessionService } from '../services/Services.ts';
import '../styles/Dashboard.css';

const MenteeDashboard = ({ userData, onLogout }) => {
  const [user, setUser] = useState(userData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState('mentors'); // 'mentors', 'video-call', 'sessions'
  const [mentors, setMentors] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [filters, setFilters] = useState({
    expertise: '',
    availability: '',
    rating: ''
  });
  const [filteredMentors, setFilteredMentors] = useState([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    scheduledDateTime: '',
    durationMinutes: 60,
    sessionType: 'VIDEO_CALL',
    notes: ''
  });
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
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
    } else if (currentView === 'sessions') {
      fetchUpcomingSessions();
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

  const fetchUpcomingSessions = async () => {
    setIsLoading(true);
    try {
      const response = await SessionService.getUpcomingSessions();
      if (response.success && response.data) {
        setUpcomingSessions(response.data);
      } else {
        console.error('Failed to fetch upcoming sessions:', response.error);
        setUpcomingSessions([]);
      }
    } catch (error) {
      console.error('Error fetching upcoming sessions:', error);
      setUpcomingSessions([]);
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
    setShowBookingModal(true);
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
  };

  const fetchAvailableTimeSlots = async () => {
    if (!selectedMentor || !selectedDate) return;

    setIsLoadingSlots(true);
    try {
      const request = {
        mentorId: selectedMentor.id,
        startDate: selectedDate,
        endDate: selectedDate, // For now, just get slots for the selected date
        durationMinutes: bookingData.durationMinutes
      };

      const response = await SessionService.getAvailableTimeSlots(request);
      if (response.success && response.data) {
        setAvailableTimeSlots(response.data);
      } else {
        console.error('Failed to fetch time slots:', response.error);
        setAvailableTimeSlots([]);
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
      setAvailableTimeSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setBookingData(prev => ({ ...prev, scheduledDateTime: '' }));
    setAvailableTimeSlots([]);
    // Auto-load slots when date changes
    if (date && bookingData.durationMinutes) {
      setTimeout(() => fetchAvailableTimeSlots(), 100);
    }
  };

  const handleDurationChange = (duration) => {
    setBookingData(prev => ({ ...prev, durationMinutes: duration }));
    setAvailableTimeSlots([]);
    // Auto-load slots when duration changes
    if (selectedDate && duration) {
      setTimeout(() => fetchAvailableTimeSlots(), 100);
    }
  };

  // Helper function to check if a date is a weekend
  const isWeekend = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
  };

  // Helper function to get availability type for display
  const getAvailabilityType = (dateString) => {
    return isWeekend(dateString) ? 'Weekend' : 'Weekday';
  };

  // Handle slot selection (only selects the time, doesn't book automatically)
  const handleSlotSelection = (slot) => {
    setBookingData(prev => ({ ...prev, scheduledDateTime: slot.startTime }));
  };

  const handleBookingSubmit = async () => {
    if (!selectedMentor || !bookingData.scheduledDateTime) {
      // eslint-disable-next-line no-restricted-globals
      alert('Please select a date and time for the session');
      return;
    }

    setIsLoading(true);
    try {
      const bookingRequest = {
        mentorId: selectedMentor.id,
        scheduledDateTime: bookingData.scheduledDateTime,
        durationMinutes: bookingData.durationMinutes,
        sessionType: bookingData.sessionType,
        notes: bookingData.notes
      };

      const response = await SessionService.bookSession(bookingRequest);
      if (response.success) {
        // eslint-disable-next-line no-restricted-globals
        alert('Session booked successfully!');
        setShowBookingModal(false);
        setBookingData({
          scheduledDateTime: '',
          durationMinutes: 60,
          sessionType: 'VIDEO_CALL',
          notes: ''
        });
        // Refresh sessions if we're on the sessions view
        if (currentView === 'sessions') {
          fetchUpcomingSessions();
        }
      } else {
        // eslint-disable-next-line no-restricted-globals
        alert('Failed to book session: ' + response.error);
      }
    } catch (error) {
      console.error('Error booking session:', error);
      // eslint-disable-next-line no-restricted-globals
      alert('Failed to book session. Please try again.');
    } finally {
      setIsLoading(false);
    }
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

  const handleCancelSession = async (sessionId) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Are you sure you want to cancel this session?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await SessionService.cancelSession(sessionId);
      if (response.success) {
        // eslint-disable-next-line no-restricted-globals
        alert('Session cancelled successfully!');
        fetchUpcomingSessions();
      } else {
        // eslint-disable-next-line no-restricted-globals
        alert('Failed to cancel session: ' + response.error);
      }
    } catch (error) {
      console.error('Error cancelling session:', error);
      // eslint-disable-next-line no-restricted-globals
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
                <p><strong>Availability:</strong> 
                  <span className="availability-details">
                    {mentor.availability || 'Not specified'}
                  </span>
                </p>
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

  const renderSessions = () => (
    <div className="dashboard-content">
      <div className="dashboard-card">
        <h3>Upcoming Sessions</h3>
        <div className="sessions-count">
          <p>You have {upcomingSessions.length} upcoming session{upcomingSessions.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="sessions-grid">
        {upcomingSessions.length === 0 ? (
          <div className="no-sessions">
            <p>No upcoming sessions. Book a session with a mentor to get started!</p>
          </div>
        ) : (
          upcomingSessions.map(session => (
            <div key={session.id} className="session-card">
              <div className="session-header">
                <h4>Session with {session.mentorName}</h4>
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
                <button 
                  className="btn btn-primary"
                  onClick={() => handleJoinSession(session)}
                  disabled={session.status !== 'CONFIRMED'}
                >
                  {session.status === 'CONFIRMED' ? 'Join Session' : 'Waiting for Confirmation'}
                </button>
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
  );

  const renderBookingModal = () => {
    if (!showBookingModal || !selectedMentor) return null;

    return (
      <div className="modal-overlay">
        <div className="booking-modal">
          <div className="modal-header">
            <h3>Book Session with {selectedMentor.name}</h3>
            <button 
              className="modal-close"
              onClick={() => setShowBookingModal(false)}
            >
              ×
            </button>
          </div>
          <div className="modal-content">
            {/* First Row: Date, Duration, Session Type */}
            <div className="form-row">
              <div className="form-group">
                <label>Date:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="form-group">
                <label>Duration (minutes):</label>
                <select
                  value={bookingData.durationMinutes}
                  onChange={(e) => handleDurationChange(parseInt(e.target.value))}
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
              <div className="form-group">
                <label>Session Type:</label>
                <select
                  value={bookingData.sessionType}
                  onChange={(e) => setBookingData(prev => ({ ...prev, sessionType: e.target.value }))}
                >
                  <option value="VIDEO_CALL">Video Call</option>
                  <option value="CHAT">Chat</option>
                  <option value="EMAIL">Email</option>
                </select>
              </div>
            </div>
            
            {/* Second Row: Available Time Slots */}
            {selectedDate && (
              <div className="form-row time-slots-row">
                <div className="form-group full-width">
                  <label>Available Time Slots ({getAvailabilityType(selectedDate)}):</label>
                  <div className="availability-info">
                    <p className="availability-type">
                      📅 {getAvailabilityType(selectedDate)} Availability
                      {isWeekend(selectedDate) ? ' (10:00 AM - 4:00 PM)' : ' (9:00 AM - 5:00 PM)'}
                    </p>
                  </div>
                  
                  {isLoadingSlots && (
                    <div className="loading-slots">
                      <div className="spinner-small"></div>
                      <p>Loading available slots...</p>
                    </div>
                  )}
                  
                  {availableTimeSlots.length === 0 && !isLoadingSlots && (
                    <p className="no-slots-message">
                      No available slots found for this {getAvailabilityType(selectedDate).toLowerCase()}. 
                      Try a different date or duration.
                    </p>
                  )}
                  
                  {!isLoadingSlots && availableTimeSlots.length > 0 && (
                    <div className="time-slots-grid">
                      {availableTimeSlots.map((slot, index) => (
                        <button
                          key={index}
                          type="button"
                          className={`time-slot-btn ${bookingData.scheduledDateTime === slot.startTime ? 'selected' : ''} ${!slot.available ? 'unavailable' : ''}`}
                          onClick={() => slot.available ? handleSlotSelection(slot) : null}
                          disabled={isLoading || !slot.available}
                        >
                          {slot.formattedTime}
                          {!slot.available && <span className="unavailable-indicator">Booked</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Third Row: Notes */}
            <div className="form-row notes-row">
              <div className="form-group full-width">
                <label>Notes (optional):</label>
                <textarea
                  value={bookingData.notes}
                  onChange={(e) => setBookingData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any specific topics or questions you'd like to discuss..."
                  rows={3}
                />
              </div>
            </div>
          </div>
          <div className="modal-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => setShowBookingModal(false)}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleBookingSubmit}
              disabled={isLoading || !bookingData.scheduledDateTime}
            >
              {isLoading ? 'Booking...' : 'Book Session'}
            </button>
          </div>
        </div>
      </div>
    );
  };

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
              className={`btn btn-secondary ${currentView === 'sessions' ? 'active' : ''}`}
              onClick={() => setCurrentView('sessions')}
            >
              📅 My Sessions
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

      {currentView === 'mentors' ? renderMentorListing() : currentView === 'sessions' ? renderSessions() : renderVideoCall()}
      {renderBookingModal()}
    </div>
  );
};

export default MenteeDashboard; 