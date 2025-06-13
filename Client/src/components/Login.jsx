import React, { useState } from 'react';
import { AuthService } from '../services/Services.ts';
import '../styles/Login.css';

const Login = ({ onLoginSuccess, onSwitchToSignin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });
  const [signupData, setSignupData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'mentee'
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

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
    
    if (!loginData.username) {
      newErrors.username = 'Username is required';
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
    
    if (!signupData.username) {
      newErrors.username = 'Username is required';
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

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (validateLoginForm()) {
      setIsLoading(true);
      try {
        const response = await AuthService.login(loginData);
        
        if (response.success) {
          // Store token and user data
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify({
            username: response.data.username,
            email: response.data.email,
            roles: response.data.roles
          }));
          
          // Clear any existing errors
          setErrors({});
          
          // Call the parent component's callback to navigate to dashboard
          if (onLoginSuccess) {
            onLoginSuccess(response.data);
          } else {
            // Fallback: redirect to dashboard page
            window.location.href = '/dashboard';
          }
        } else {
          setErrors({ general: 'Incorrect username or password' });
        }
      } catch (error) {
        setErrors({ general: 'Incorrect username or password' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (validateSignupForm()) {
      setIsLoading(true);
      try {
        // Prepare signup data according to SignupRequest interface
        const signupPayload = {
          username: signupData.username,
          email: signupData.email,
          password: signupData.password
        };
        
        const response = await AuthService.signup(signupPayload);
        
        if (response.success) {
          // Clear any existing errors
          setErrors({});
          
          // Reset signup form
          setSignupData({
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            userType: 'mentee'
          });
          
          // Switch to login form
          setIsLogin(true);
          
          // Show success message
          alert('Account created successfully! Please sign in with your credentials.');
          
          // Call parent component's callback if provided
          if (onSwitchToSignin) {
            onSwitchToSignin();
          }
        } else {
          // Handle specific signup errors
          let errorMessage = 'Signup failed';
          if (response.error) {
            if (response.error.toLowerCase().includes('username') && response.error.toLowerCase().includes('exists')) {
              errorMessage = 'Username already exists';
            } else if (response.error.toLowerCase().includes('email') && response.error.toLowerCase().includes('exists')) {
              errorMessage = 'Email already exists';
            } else if (response.error.toLowerCase().includes('password')) {
              errorMessage = 'Password does not meet requirements';
            } else {
              errorMessage = response.error;
            }
          }
          setErrors({ general: errorMessage });
        }
      } catch (error) {
        setErrors({ general: 'An error occurred during signup. Please try again.' });
      } finally {
        setIsLoading(false);
      }
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

        {errors.general && (
          <div className="error-message general-error">
            {errors.general}
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleLoginSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={loginData.username}
                onChange={handleLoginChange}
                className={errors.username ? 'error' : ''}
                placeholder="Enter your username"
                disabled={isLoading}
              />
              {errors.username && <span className="error-message">{errors.username}</span>}
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
                disabled={isLoading}
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

            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignupSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="signup-username">Username</label>
              <input
                type="text"
                id="signup-username"
                name="username"
                value={signupData.username}
                onChange={handleSignupChange}
                className={errors.username ? 'error' : ''}
                placeholder="Choose a username"
                disabled={isLoading}
              />
              {errors.username && <span className="error-message">{errors.username}</span>}
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
                disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>

            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        <div className="login-footer">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button type="button" onClick={toggleForm} className="link-button" disabled={isLoading}>
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 