// src/components/login/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api'; // Import the complete API service
import './login.css';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('student');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(true);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      let response;

      // Use different login endpoints based on user type
      if (userType === 'admin') {
        response = await ApiService.adminLogin(username, password);
      } else {
        response = await ApiService.login(username, password);
      }

      // Check if login was successful
      if (response && response.token) {
        // Token and user data are automatically stored by ApiService
        const { role, user_id, full_name, department } = response;

        // Verify the role matches the selected user type
        if (userType === 'admin' && role !== 'admin') {
          setError('Invalid admin credentials. Please use admin login.');
          ApiService.logout();
          return;
        }

        if (userType === 'student' && role !== 'student') {
          setError('Access denied. You are not registered as a student.');
          ApiService.logout();
          return;
        }

        if (userType === 'teacher' && role !== 'teacher') {
          setError('Access denied. You are not registered as a teacher.');
          ApiService.logout();
          return;
        }

        // Redirect user based on their role
        switch (role) {
          case 'admin':
            navigate('/admin');
            break;
          case 'teacher':
            navigate('/teacher');
            break;
          case 'student':
            navigate('/student');
            break;
          default:
            navigate('/');
        }
      } else {
        setError(response?.error || 'Login failed. Please check your credentials.');
      }

    } catch (err) {
      // Handle different types of errors
      if (err.message.includes('Network error')) {
        setError('Cannot connect to server. Please ensure the backend is running.');
      } else if (err.message.includes('401')) {
        setError('Invalid username or password.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick login function for testing
  const quickLogin = (type) => {
    const credentials = {
      admin: { username: 'admin', password: 'password123', userType: 'admin' },
      teacher: { username: 'teacher1', password: 'password123', userType: 'teacher' },
      student: { username: 'student1', password: 'password123', userType: 'student' }
    };

    const cred = credentials[type];
    setUsername(cred.username);
    setPassword(cred.password);
    setUserType(cred.userType);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo">
            <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="50" height="50" rx="10" fill="#3498db" />
              <path d="M15 20H35M15 25H35M15 30H25M30 30H35" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="login-title">Timetable Management</h1>
          <p className="login-subtitle">Sign in to access your dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label htmlFor="userType">I am a</label>
            <select
              id="userType"
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className="user-type-select"
              disabled={isLoading}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter your username"
              className="login-input"
              disabled={isLoading}
              autoComplete="username"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              className="login-input"
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="error-message">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm1 13H7v-2h2v2zm0-3H7V4h2v6z" />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {showCredentials && (
          <div className="credentials-section">
            <div className="credentials-header">
              <span>Test Credentials</span>
              <button
                className="toggle-credentials"
                onClick={() => setShowCredentials(false)}
                type="button"
              >
                ×
              </button>
            </div>
            <div className="quick-login-buttons">
              <button
                type="button"
                className="quick-login-btn admin"
                onClick={() => quickLogin('admin')}
                disabled={isLoading}
              >
                <span className="role-icon">👤</span>
                <div>
                  <div className="role-name">Admin</div>
                  <div className="role-cred">admin / password123</div>
                </div>
              </button>
              <button
                type="button"
                className="quick-login-btn teacher"
                onClick={() => quickLogin('teacher')}
                disabled={isLoading}
              >
                <span className="role-icon">👨‍🏫</span>
                <div>
                  <div className="role-name">Teacher</div>
                  <div className="role-cred">teacher1 / password123</div>
                </div>
              </button>
              <button
                type="button"
                className="quick-login-btn student"
                onClick={() => quickLogin('student')}
                disabled={isLoading}
              >
                <span className="role-icon">👨‍🎓</span>
                <div>
                  <div className="role-name">Student</div>
                  <div className="role-cred">student1 / password123</div>
                </div>
              </button>
            </div>
          </div>
        )}

        <div className="login-footer">
          <p>© 2026 Timetable Management System</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;