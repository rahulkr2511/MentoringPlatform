import React, { useState } from 'react';
import './App.css';
import Home from './components/Home.jsx';
import Login from './components/Login.jsx';

function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home' or 'login'

  return (
    <div className="App">
      {currentView === 'home' ? (
        <Home />
      ) : (
        <Login />
      )}
      
      {/* Navigation buttons for testing */}
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
    </div>
  );
}

export default App;
