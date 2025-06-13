import React, { useState } from 'react';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [activeSessions, setActiveSessions] = useState([
    {
      id: 1,
      title: 'JavaScript Fundamentals',
      mentor: 'Sarah Johnson',
      time: '2:00 PM - 3:30 PM',
      participants: 8,
      maxParticipants: 12,
      status: 'active'
    },
    {
      id: 2,
      title: 'React Best Practices',
      mentor: 'Mike Chen',
      time: '4:00 PM - 5:30 PM',
      participants: 5,
      maxParticipants: 10,
      status: 'upcoming'
    }
  ]);

  const [userSessions, setUserSessions] = useState([
    {
      id: 3,
      title: 'Career Development Workshop',
      mentor: 'Emily Rodriguez',
      time: '10:00 AM - 11:30 AM',
      date: 'Tomorrow',
      status: 'scheduled'
    }
  ]);

  const handleJoinSession = (sessionId) => {
    // TODO: Implement join session logic
    console.log('Joining session:', sessionId);
    alert('Joining session functionality will be implemented here');
  };

  const handleStartSession = (sessionId) => {
    // TODO: Implement start session logic
    console.log('Starting session:', sessionId);
    alert('Start session functionality will be implemented here');
  };

  const handleCreateSession = () => {
    // TODO: Implement create session logic
    console.log('Creating new session');
    alert('Create session functionality will be implemented here');
  };

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1>Welcome to Your Dashboard</h1>
          <p>Manage your mentoring sessions and connect with experts</p>
        </header>

        <div className="dashboard-content">
          {/* Quick Actions Section */}
          <div className="quick-actions">
            <h2>Quick Actions</h2>
            <div className="action-buttons">
              <button 
                className="btn btn-primary action-btn"
                onClick={handleCreateSession}
              >
                <span className="btn-icon">➕</span>
                Create New Session
              </button>
              <button className="btn btn-secondary action-btn">
                <span className="btn-icon">🔍</span>
                Find Sessions
              </button>
              <button className="btn btn-secondary action-btn">
                <span className="btn-icon">👥</span>
                My Network
              </button>
            </div>
          </div>

          {/* Active Sessions Section */}
          <div className="sessions-section">
            <h2>Available Sessions</h2>
            <div className="sessions-grid">
              {activeSessions.map(session => (
                <div key={session.id} className="session-card">
                  <div className="session-header">
                    <h3>{session.title}</h3>
                    <span className={`session-status ${session.status}`}>
                      {session.status === 'active' ? '🟢 Live' : '⏰ Upcoming'}
                    </span>
                  </div>
                  <div className="session-details">
                    <p><strong>Mentor:</strong> {session.mentor}</p>
                    <p><strong>Time:</strong> {session.time}</p>
                    <p><strong>Participants:</strong> {session.participants}/{session.maxParticipants}</p>
                  </div>
                  <div className="session-actions">
                    {session.status === 'active' ? (
                      <button 
                        className="btn btn-primary"
                        onClick={() => handleJoinSession(session.id)}
                      >
                        Join Session
                      </button>
                    ) : (
                      <button 
                        className="btn btn-secondary"
                        onClick={() => handleJoinSession(session.id)}
                      >
                        Join Waitlist
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* My Sessions Section */}
          <div className="sessions-section">
            <h2>My Sessions</h2>
            <div className="sessions-grid">
              {userSessions.map(session => (
                <div key={session.id} className="session-card my-session">
                  <div className="session-header">
                    <h3>{session.title}</h3>
                    <span className="session-status scheduled">
                      📅 {session.date}
                    </span>
                  </div>
                  <div className="session-details">
                    <p><strong>Mentor:</strong> {session.mentor}</p>
                    <p><strong>Time:</strong> {session.time}</p>
                    <p><strong>Status:</strong> {session.status}</p>
                  </div>
                  <div className="session-actions">
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleStartSession(session.id)}
                    >
                      Start Session
                    </button>
                    <button className="btn btn-secondary">
                      Reschedule
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Section */}
          <div className="stats-section">
            <h2>Your Progress</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📚</div>
                <div className="stat-content">
                  <h3>12</h3>
                  <p>Sessions Completed</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-content">
                  <h3>8</h3>
                  <p>Goals Achieved</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⭐</div>
                <div className="stat-content">
                  <h3>4.8</h3>
                  <p>Average Rating</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <h3>15</h3>
                  <p>Mentors Connected</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 