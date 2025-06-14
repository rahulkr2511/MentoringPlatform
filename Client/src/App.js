import React, { useState, useEffect } from 'react';
import './App.css';
import Home from './components/Home';
import Login from './components/Login';
import MenteeDashboard from './components/MenteeDashboard';
import MentorDashboard from './components/MentorDashboard';

function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home', 'login', or 'dashboard'
  const [userData, setUserData] = useState(null);

  // Check for existing authentication on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setUserData(JSON.parse(user));
      setCurrentView('dashboard');
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUserData(userData);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUserData(null);
    setCurrentView('home');
  };

  const handleSwitchToSignin = () => {
    setCurrentView('login');
  };

  const renderDashboard = () => {
    if (!userData) return null;
    
    // Check if user has MENTOR role
    const isMentor = userData.roles && userData.roles.includes('MENTOR');
    
    if (isMentor) {
      return <MentorDashboard userData={userData} onLogout={handleLogout} />;
    } else {
      return <MenteeDashboard userData={userData} onLogout={handleLogout} />;
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return renderDashboard();
      case 'login':
        return (
          <Login 
            onLoginSuccess={handleLoginSuccess}
            onSwitchToSignin={handleSwitchToSignin}
          />
        );
      default:
        return <Home />;
    }
  };

  return (
    <div className="App">
      {renderCurrentView()}
      
      {/* Navigation buttons for testing - only show when not on dashboard */}
      {currentView !== 'dashboard' && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          display: 'flex',
          gap: '10px'
        }}>
          <button 
            onClick={() => setCurrentView('home')}
            style={{
              padding: '8px 16px',
              backgroundColor: currentView === 'home' ? '#667eea' : '#fff',
              color: currentView === 'home' ? '#fff' : '#667eea',
              border: '2px solid #667eea',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Home
          </button>
          <button 
            onClick={() => setCurrentView('login')}
            style={{
              padding: '8px 16px',
              backgroundColor: currentView === 'login' ? '#667eea' : '#fff',
              color: currentView === 'login' ? '#fff' : '#667eea',
              border: '2px solid #667eea',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Login
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
