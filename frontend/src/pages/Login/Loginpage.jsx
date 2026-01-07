import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../../services/api.js'; // Make sure this path is correct
import './login.css'; // We will create this for styling

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await loginUser({ username, password });
      
      // On successful login, the backend sends back a token and user role
      const { token, role } = response.data;

      // CRITICAL STEP: Save the token to localStorage
      localStorage.setItem('token', token);

      // Redirect user based on their role
      if (role === 'admin') {
        navigate('/dashboard'); // Or your admin-specific route
      } else if (role === 'student') {
        navigate('/student-dashboard'); // Or your student-specific route
      } else if (role === 'teacher') {
        navigate('/teacher-dashboard'); // Or your teacher-specific route
      } else {
        navigate('/'); // Fallback redirect
      }

    } catch (err) {
      // Handle login errors (e.g., invalid credentials from the server)
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">Please enter your credentials to log in.</p>
        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter your username"
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
            />
          </div>
          
          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;