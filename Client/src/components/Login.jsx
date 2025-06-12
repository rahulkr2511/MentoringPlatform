import React, { useState } from 'react';
import '../styles/Login.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [signupData, setSignupData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'mentee'
  });
  const [errors, setErrors] = useState({});

  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({...errors, [e.target.name]: ''});
    }
  };

  const handleSignupChange = (e) => {
    setSignupData({
      ...signupData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({...errors, [e.target.name]: ''});
    }
  };

  const validateLoginForm = () => {
    const newErrors = {};
    
    if (!loginData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(loginData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!loginData.password) {
      newErrors.password = 'Password is required';
    } else if (loginData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignupForm = () => {
    const newErrors = {};
    
    if (!signupData.firstName) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!signupData.lastName) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!signupData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(signupData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!signupData.password) {
      newErrors.password = 'Password is required';
    } else if (signupData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!signupData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (signupData.password !== signupData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (validateLoginForm()) {
      // TODO: Implement login logic
      console.log('Login data:', loginData);
      alert('Login functionality will be implemented here');
    }
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    if (validateSignupForm()) {
      // TODO: Implement signup logic
      console.log('Signup data:', signupData);
      alert('Signup functionality will be implemented here');
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setErrors({});
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p>{isLogin ? 'Sign in to your account' : 'Join our mentoring platform'}</p>
        </div>

        {isLogin ? (
          <form onSubmit={handleLoginSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={loginData.email}
                onChange={handleLoginChange}
                className={errors.email ? 'error' : ''}
                placeholder="Enter your email"
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={loginData.password}
                onChange={handleLoginChange}
                className={errors.password ? 'error' : ''}
                placeholder="Enter your password"
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <a href="#" className="forgot-password">Forgot password?</a>
            </div>

            <button type="submit" className="btn btn-primary">
              Sign In
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignupSubmit} className="login-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={signupData.firstName}
                  onChange={handleSignupChange}
                  className={errors.firstName ? 'error' : ''}
                  placeholder="Enter first name"
                />
                {errors.firstName && <span className="error-message">{errors.firstName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={signupData.lastName}
                  onChange={handleSignupChange}
                  className={errors.lastName ? 'error' : ''}
                  placeholder="Enter last name"
                />
                {errors.lastName && <span className="error-message">{errors.lastName}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="signup-email">Email</label>
              <input
                type="email"
                id="signup-email"
                name="email"
                value={signupData.email}
                onChange={handleSignupChange}
                className={errors.email ? 'error' : ''}
                placeholder="Enter your email"
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="userType">I want to</label>
              <select
                id="userType"
                name="userType"
                value={signupData.userType}
                onChange={handleSignupChange}
              >
                <option value="mentee">Find a Mentor</option>
                <option value="mentor">Become a Mentor</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="signup-password">Password</label>
              <input
                type="password"
                id="signup-password"
                name="password"
                value={signupData.password}
                onChange={handleSignupChange}
                className={errors.password ? 'error' : ''}
                placeholder="Create a password"
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={signupData.confirmPassword}
                onChange={handleSignupChange}
                className={errors.confirmPassword ? 'error' : ''}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>

            <button type="submit" className="btn btn-primary">
              Create Account
            </button>
          </form>
        )}

        <div className="login-footer">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button type="button" onClick={toggleForm} className="link-button">
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 