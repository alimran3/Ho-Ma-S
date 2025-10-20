import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LandingPage.css';
import { FaHotel } from "react-icons/fa6";


const LandingPage = () => {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [instituteId, setInstituteId] = useState('');
  const [formData, setFormData] = useState({
    eiin: '',
    name: '',
    type: 'university',
    location: '',
    address: '',
    ownerName: '',
    contact: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const instituteTypes = [
    { value: 'university', label: 'University' },
    { value: 'college', label: 'College' },
    { value: 'school', label: 'School' },
    { value: 'private', label: 'Private Hostel' }
  ];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Password validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }
    
    try {
      const { confirmPassword, ...submitData } = formData;
      const response = await axios.post('http://localhost:5000/api/institute/register', submitData);
      alert(`Registration successful! Your Institute ID is: ${response.data.instituteId}`);
      setIsRegistering(false);
      setFormData({
        eiin: '',
        name: '',
        type: 'university',
        location: '',
        address: '',
        ownerName: '',
        contact: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInstituteLogin = async () => {
    if (!instituteId.trim()) {
      setError('Please enter Institute ID');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`http://localhost:5000/api/institute/verify/${instituteId}`);
      if (response.data.exists) {
        navigate(`/login-selection/${instituteId}`);
      }
    } catch (err) {
      setError('Invalid Institute ID');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-page">
      {/* Left Side - Image */}
      <div className="left-side">
        <img 
          src="./zikrul.jpg" 
          alt="Hostel Building" 
          className="hostel-image"
        />
        <div className="overlay-content">
          <h1>Hostel Management System</h1>
        </div>
      </div>

      {/* Right Side - Forms */}
      <div className="right-side">
        {!isRegistering ? (
          // Login Form
          <div className="form-wrapper login-wrapper">
            <div className="form-logo">
              <div className="logo-circle">
                <span>HMS</span>
              </div>
            </div>
            <h2>Welcome Back</h2>
            <p className="subtitle">Enter your institute ID to continue</p>
            
            <div className="input-group">
              <label>Institute ID</label>
              <div className="input-with-icon">
                <i className="icon"><FaHotel style={{color:'red'}}/>
</i>
                <input
                  type="text"
                  placeholder="e.g., INST-ABC123"
                  value={instituteId}
                  onChange={(e) => setInstituteId(e.target.value)}
                />
              </div>
            </div>

            <button 
              onClick={handleInstituteLogin} 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Checking...' : 'Access Portal'}
            </button>

            {error && <div className="error-message">{error}</div>}

            <div className="separator">
              <span>New to our platform?</span>
            </div>

            <button 
              onClick={() => setIsRegistering(true)} 
              className="btn-secondary"
            >
              Register New Institute
            </button>
          </div>
        ) : (
          // Registration Form
          <div className="form-wrapper registration-wrapper">
            <div className="form-header">
              <button 
                onClick={() => setIsRegistering(false)} 
                className="back-btn"
              >
                <span>←</span> Back to Login
              </button>
              <h2>Institute Registration</h2>
              <p className="subtitle">Fill in the details to register your institute</p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="registration-form">
              {/* Institute Information Section */}
              <div className="form-section">
                <h3 className="section-title">Institute Information</h3>
                
                <div className="form-row">
                  <div className="input-group">
                    <label>EIIN Number <span className="required">*</span></label>
                    <input
                      type="text"
                      name="eiin"
                      value={formData.eiin}
                      onChange={handleInputChange}
                      placeholder="Enter EIIN number"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Institute Type <span className="required">*</span></label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      required
                    >
                      {instituteTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="input-group full-width">
                  <label>Institute Name <span className="required">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter institute name"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label>Location <span className="required">*</span></label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="City, State"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Full Address <span className="required">*</span></label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Complete address"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Owner Information Section */}
              <div className="form-section">
                <h3 className="section-title">Owner Information</h3>
                
                <div className="form-row">
                  <div className="input-group">
                    <label>Owner Name <span className="required">*</span></label>
                    <input
                      type="text"
                      name="ownerName"
                      value={formData.ownerName}
                      onChange={handleInputChange}
                      placeholder="Full name"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Contact Number <span className="required">*</span></label>
                    <input
                      type="tel"
                      name="contact"
                      value={formData.contact}
                      onChange={handleInputChange}
                      placeholder="+880 1XXX-XXXXXX"
                      required
                    />
                  </div>
                </div>

                <div className="input-group full-width">
                  <label>Email Address <span className="required">*</span></label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="email@example.com"
                    required
                  />
                </div>
              </div>

              {/* Account Credentials Section */}
              <div className="form-section">
                <h3 className="section-title">Account Credentials</h3>
                
                <div className="input-group full-width">
                  <label>Username <span className="required">*</span></label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Choose a username"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label>Password <span className="required">*</span></label>
                    <div className="password-input">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Min. 6 characters"
                        required
                      />
                      <button
                        type="button"
                        className="toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Confirm Password <span className="required">*</span></label>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Re-enter password"
                      required
                    />
                  </div>
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn-primary submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Registering...
                    </>
                  ) : (
                    'Complete Registration'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPage;