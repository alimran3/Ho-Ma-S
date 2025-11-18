import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LoginPage.css';

const LoginPage = () => {
  const { instituteId, userType } = useParams();
  const navigate = useNavigate();

  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Capitalize user type for display
  const getUserTypeDisplay = () => userType.charAt(0).toUpperCase() + userType.slice(1);

  // Emoji for user type
  const getUserIcon = () => {
    const icons = { owner: '👤', manager: '👨‍💼', student: '🎓', guest: '🏠' };
    return icons[userType] || '👤';
  };

  const handleInputChange = (e) => {
    setCredentials(prev => ({ 
      ...prev, 
      [e.target.name]: e.target.value 
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!credentials.username.trim() || !credentials.password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Attempting login with:', { 
        instituteId, 
        userType, 
        username: credentials.username 
      });

      let response;
      
      // Special handling for guest login (different endpoint)
      if (userType === 'guest') {
        response = await axios.post('http://localhost:5000/api/auth/guest-login', {
          username: credentials.username.trim(),
          password: credentials.password
        });
      } else {
        // Regular login for owner, manager, student
        response = await axios.post('http://localhost:5000/api/auth/login', {
          username: credentials.username.trim(),
          password: credentials.password,
          instituteId: instituteId,
          userType: userType,
        });
      }

      console.log('Login response received:', response.data);

      // Handle both response formats (success field or direct token)
      const token = response.data.token;
      const user = response.data.user;
      const success = response.data.success !== undefined ? response.data.success : true;

      // Verify response data
      if (!success || !token || !user) {
        throw new Error('Invalid response from server');
      }

      // Save token & user info to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('userType', userType);
      localStorage.setItem('instituteId', instituteId);
      localStorage.setItem('username', user.username);
      localStorage.setItem('userId', user.id);
      localStorage.setItem('fullName', user.fullName || '');
      localStorage.setItem('userFullName', user.fullName || '');

      // Verify storage
      console.log('LocalStorage after login:', {
        token: localStorage.getItem('token'),
        userType: localStorage.getItem('userType'),
        instituteId: localStorage.getItem('instituteId'),
        username: localStorage.getItem('username')
      });

      // Small delay to ensure storage is committed
      setTimeout(() => {
        const routes = {
          owner: '/owner/dashboard',
          manager: '/manager/dashboard',
          student: '/student/dashboard',
          guest: '/guest/info',
        };
        
        const targetRoute = routes[userType];
        console.log('Navigating to:', targetRoute);
        
        if (targetRoute) {
          navigate(targetRoute, { replace: true });
        } else {
          setError('Invalid user type route');
        }
      }, 100);

    } catch (err) {
      console.error('Login error details:', err);
      
      // Enhanced error handling
      if (err.code === 'NETWORK_ERROR' || err.code === 'ECONNREFUSED') {
        setError('Cannot connect to server. Please check if the backend is running on http://localhost:5000');
      } else if (err.response) {
        // Server responded with error status
        const errorMessage = err.response.data.message || 
                           err.response.data.error || 
                           `Login failed (Status: ${err.response.status})`;
        setError(errorMessage);
        
        // Clear form on certain errors
        if (err.response.status === 401) {
          setCredentials({ username: '', password: '' });
        }
      } else if (err.request) {
        // Request was made but no response received
        setError('No response from server. Please check your connection.');
      } else {
        // Other errors
        setError('Login failed: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1B3C53',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#F9F3EF',
        padding: '50px 40px',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '450px',
        border: '1px solid #456882'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            backgroundColor: '#456882',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 25px',
            fontSize: '3rem',
            color: '#F9F3EF'
          }}>{getUserIcon()}</div>
          <h2 style={{
            color: '#1B3C53',
            marginBottom: '15px',
            fontWeight: 700,
            fontSize: '2rem',
            letterSpacing: '-0.02em'
          }}>{getUserTypeDisplay()} Login</h2>
          <p style={{
            color: '#456882',
            fontSize: '1rem',
            fontWeight: 500
          }}>Institute ID: {instituteId}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleInputChange}
              placeholder={`Enter ${userType} username`}
              required
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              placeholder="Enter password"
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="error-message">
              <strong>Error:</strong> {error}
            </div>
          )}

          <button 
            type="submit" 
            className="login-button" 
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="button-spinner"></span>
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        {/* Debug Info (remove in production) */}
        <div className="debug-info">
          <small>
            Current State: {loading ? 'Loading' : 'Ready'} | 
            User: {credentials.username ? 'Filled' : 'Empty'} | 
            Pass: {credentials.password ? 'Filled' : 'Empty'}
            {userType === 'guest' && ' | Using Guest Endpoint'}
          </small>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <button
            type="button"
            onClick={() => navigate(`/login-selection/${instituteId}`)}
            className="back-link"
            disabled={loading}
          >
            ← Back to login selection
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;