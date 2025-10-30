import React from 'react';
import '../styles/Home.css';

const Home = ({ onGetStarted }) => {
  return (
    <div className="home">
      <div className="home-container">
        <header className="home-header">
          <h1>Welcome to PeerNest Mentoring</h1>
          <p>Connect, Learn, and Grow with Expert Mentors</p>
        </header>
        
        <div className="home-content">
          <div className="features-section">
            <h2>Why Choose Our Platform?</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">👥</div>
                <h3>Expert Mentors</h3>
                <p>Connect with industry professionals and experienced mentors</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🎯</div>
                <h3>Personalized Learning</h3>
                <p>Get customized guidance tailored to your goals</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🚀</div>
                <h3>Career Growth</h3>
                <p>Accelerate your career with proven strategies</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">💡</div>
                <h3>Skill Development</h3>
                <p>Learn new skills and enhance existing ones</p>
              </div>
            </div>
          </div>
          
          <div className="cta-section">
            <h2>Ready to Start Your Journey?</h2>
            <p>Join thousands of professionals who have transformed their careers</p>
            <div className="cta-buttons">
              <button className="btn btn-primary" onClick={() => onGetStarted && onGetStarted()}>Get Started</button>
              <button className="btn btn-secondary">Learn More</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 