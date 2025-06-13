import React, { useState, useEffect } from 'react';
import { AuthService } from '../services/Services.ts';
import '../styles/Dashboard.css';

const Dashboard = ({ userData, onLogout }) => {
  const [user, setUser] = useState(userData || null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If no userData passed as prop, try to get from localStorage or fetch from API
    if (!user && !userData) {
      const storedUser = AuthService.getStoredUser();
      if (storedUser) {
        setUser(storedUser);
      } else if (AuthService.isAuthenticated()) {
        // Try to fetch current user data from API
        fetchCurrentUser();
      }
    }
  }, [user, userData]);

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
        // Update stored user data
        localStorage.setItem('user', JSON.stringify({
          username: response.data.username,
          email: response.data.email,
          roles: response.data.roles
        }));
      } else {
        // If API call fails, redirect to login
        handleLogout();
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    // Use AuthService for logout
    AuthService.logout();
    
    // Call parent component's logout callback
    if (onLogout) {
      onLogout();
    } else {
      // Fallback: redirect to home
      window.location.href = '/';
    }
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
          <h1>Welcome to Your Dashboard</h1>
          <p>Hello, {user.username}!</p>
        </div>
        <div className="dashboard-actions">
          <button onClick={handleLogout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-card">
          <h3>User Information</h3>
          <div className="user-info">
            <p><strong>Username:</strong> {user.username}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Roles:</strong> {user.roles ? user.roles.join(', ') : 'No roles assigned'}</p>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Quick Actions</h3>
          <div className="quick-actions">
            <button className="btn btn-primary">View Profile</button>
            <button className="btn btn-primary">Find Mentors</button>
            <button className="btn btn-primary">My Sessions</button>
            <button className="btn btn-primary">Messages</button>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Recent Activity</h3>
          <div className="recent-activity">
            <p>No recent activity to display.</p>
            <p>Start by exploring mentors or updating your profile!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 