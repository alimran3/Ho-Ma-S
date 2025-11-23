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
      const response = await axios.post('/api/institute/register', submitData);
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
      const response = await axios.get(`/api/institute/verify/${instituteId}`);
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
    <div style={{display: 'flex', minHeight: '100vh', backgroundColor: '#F9F3EF'}}>
      {/* Left Sidebar */}
      <div style={{
        width: '320px',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        overflowY: 'auto',
        backgroundColor: '#1B3C53',
        color: '#F9F3EF',
        padding: '24px'
      }}>
        <div style={{marginBottom: '32px'}}>
          <h2 style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 600,
            marginBottom: '8px'
          }}>Hostel Management System</h2>
          <p style={{
            margin: 0,
            color: '#456882',
            fontSize: '0.9rem'
          }}>Institute Portal</p>
        </div>

        <div style={{
          backgroundColor: '#456882',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            backgroundColor: '#F9F3EF',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '2rem',
            color: '#1B3C53'
          }}>
            <FaHotel />
          </div>
          <h3 style={{
            margin: '0 0 8px 0',
            fontSize: '1.2rem',
            fontWeight: 600,
            textAlign: 'center'
          }}>Welcome</h3>
          <p style={{
            margin: '0 0 16px 0',
            color: '#D2C1B6',
            fontSize: '0.9rem',
            textAlign: 'center'
          }}>Institute Portal</p>
          <div style={{display: 'grid', gap: '8px'}}>
            <p style={{margin: 0, fontSize: '0.9rem'}}>
              <span style={{color: '#D2C1B6'}}>•</span> Access your institute dashboard
            </p>
            <p style={{margin: 0, fontSize: '0.9rem'}}>
              <span style={{color: '#D2C1B6'}}>•</span> Manage halls and students
            </p>
            <p style={{margin: 0, fontSize: '0.9rem'}}>
              <span style={{color: '#D2C1B6'}}>•</span> View reports and analytics
            </p>
          </div>
        </div>

        <div style={{
          backgroundColor: '#456882',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h4 style={{
            margin: '0 0 16px 0',
            fontSize: '1.1rem',
            fontWeight: 600
          }}>Features</h4>
          <div style={{display: 'grid', gap: '12px'}}>
            <div style={{display: 'flex', alignItems: 'center', fontSize: '0.9rem'}}>
              <span style={{color: '#D2C1B6', marginRight: '8px'}}>🏠</span>
              <div>
                <div style={{fontWeight: 600}}>Hall Management</div>
                <div style={{color: '#D2C1B6', fontSize: '0.8rem'}}>Create and manage halls</div>
              </div>
            </div>
            <div style={{display: 'flex', alignItems: 'center', fontSize: '0.9rem'}}>
              <span style={{color: '#D2C1B6', marginRight: '8px'}}>👥</span>
              <div>
                <div style={{fontWeight: 600}}>Student Portal</div>
                <div style={{color: '#D2C1B6', fontSize: '0.8rem'}}>Registration & management</div>
              </div>
            </div>
            <div style={{display: 'flex', alignItems: 'center', fontSize: '0.9rem'}}>
              <span style={{color: '#D2C1B6', marginRight: '8px'}}>📈</span>
              <div>
                <div style={{fontWeight: 600}}>Analytics</div>
                <div style={{color: '#D2C1B6', fontSize: '0.8rem'}}>Comprehensive reporting</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        marginLeft: '320px',
        padding: '24px',
        width: '100%',
        backgroundImage: 'url(https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: 0.9,
        minHeight: '100vh'
      }}>
        <div className="content-header">
          <h1 style={{color: '#1B3C53'}}>{isRegistering ? 'Institute Registration' : 'Welcome Back'}</h1>
          <p style={{color: '#456882'}}>{isRegistering ? 'Create your institute account' : 'Access your institute portal'}</p>
        </div>

        {!isRegistering ? (
          // Login Form
          <div className="form-card" style={{
            backgroundColor: 'rgba(249, 243, 239, 0.95)',
            border: '1px solid #456882',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
                <div className="form-header" style={{
                  textAlign: 'center',
                  marginBottom: '32px'
                }}>
                  <div className="form-logo" style={{
                    width: '80px',
                    height: '80px',
                    backgroundColor: '#1B3C53',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    color: '#F9F3EF',
                    fontSize: '2rem'
                  }}>
                    <FaHotel />
                  </div>
                  <h2 style={{
                    color: '#1B3C53',
                    marginBottom: '8px',
                    fontSize: '1.8rem',
                    fontWeight: 600
                  }}>Institute Login</h2>
                  <p style={{
                    color: '#456882',
                    fontSize: '1rem'
                  }}>Enter your institute ID to continue</p>
                </div>

                <div className="form-group" style={{marginBottom: '24px'}}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#1B3C53',
                    fontWeight: 600,
                    fontSize: '0.95rem'
                  }}>Institute ID</label>
                  <input
                    type="text"
                    placeholder="e.g., INST-ABC123"
                    value={instituteId}
                    onChange={(e) => setInstituteId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      border: '2px solid #456882',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      backgroundColor: '#F9F3EF',
                      color: '#1B3C53',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <button
                  onClick={handleInstituteLogin}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '16px',
                    backgroundColor: '#1B3C53',
                    color: '#F9F3EF',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginBottom: '16px'
                  }}
                >
                  {loading ? 'Checking...' : 'Access Portal'}
                </button>

                {error && (
                  <div style={{
                    backgroundColor: '#FEE2E2',
                    color: '#DC2626',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    fontSize: '0.95rem',
                    textAlign: 'center',
                    border: '1px solid #EF4444'
                  }}>
                    {error}
                  </div>
                )}

                <div style={{
                  textAlign: 'center',
                  padding: '16px 0',
                  borderTop: '1px solid #456882',
                  marginTop: '24px'
                }}>
                  <p style={{
                    color: '#456882',
                    marginBottom: '16px',
                    fontSize: '0.95rem'
                  }}>New to our platform?</p>
                  <button
                    onClick={() => setIsRegistering(true)}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#F9F3EF',
                      color: '#1B3C53',
                      border: '2px solid #456882',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Register New Institute
                  </button>
                </div>
              </div>
        ) : (
          // Registration Form
          <div className="form-card" style={{
            backgroundColor: '#F9F3EF',
            border: '1px solid #456882',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <div className="form-header" style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '32px'
            }}>
              <button
                onClick={() => setIsRegistering(false)}
                style={{
                  backgroundColor: '#456882',
                  color: '#F9F3EF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  marginRight: '16px',
                  fontSize: '1rem'
                }}
              >
                ← Back
              </button>
              <div>
                <h2 style={{
                  color: '#1B3C53',
                  marginBottom: '4px',
                  fontSize: '1.8rem',
                  fontWeight: 600
                }}>Institute Registration</h2>
                <p style={{
                  color: '#456882',
                  fontSize: '1rem',
                  margin: 0
                }}>Fill in the details to register your institute</p>
              </div>
            </div>

            <form onSubmit={handleRegisterSubmit}>
              {/* Institute Information Section */}
              <div className="form-section" style={{
                marginBottom: '32px',
                padding: '24px',
                backgroundColor: '#D2C1B6',
                borderRadius: '8px',
                border: '1px solid #456882'
              }}>
                <h3 style={{
                  color: '#1B3C53',
                  marginBottom: '20px',
                  fontSize: '1.3rem',
                  fontWeight: 600
                }}>Institute Information</h3>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px'}}>
                  <div className="form-group">
                    <label style={{
                      display: 'block',
                      marginBottom: '6px',
                      color: '#1B3C53',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}>EIIN Number <span style={{color: '#DC2626'}}>*</span></label>
                    <input
                      type="text"
                      name="eiin"
                      value={formData.eiin}
                      onChange={handleInputChange}
                      placeholder="Enter EIIN number"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #456882',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        backgroundColor: '#F9F3EF',
                        color: '#1B3C53',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{
                      display: 'block',
                      marginBottom: '6px',
                      color: '#1B3C53',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}>Institute Type <span style={{color: '#DC2626'}}>*</span></label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #456882',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        backgroundColor: '#F9F3EF',
                        color: '#1B3C53',
                        boxSizing: 'border-box'
                      }}
                    >
                      {instituteTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{marginBottom: '16px'}}>
                  <label style={{
                    display: 'block',
                    marginBottom: '6px',
                    color: '#1B3C53',
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}>Institute Name <span style={{color: '#DC2626'}}>*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter institute name"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #456882',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      backgroundColor: '#F9F3EF',
                      color: '#1B3C53',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                  <div className="form-group">
                    <label style={{
                      display: 'block',
                      marginBottom: '6px',
                      color: '#1B3C53',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}>Location <span style={{color: '#DC2626'}}>*</span></label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="City, State"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #456882',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        backgroundColor: '#F9F3EF',
                        color: '#1B3C53',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{
                      display: 'block',
                      marginBottom: '6px',
                      color: '#1B3C53',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}>Full Address <span style={{color: '#DC2626'}}>*</span></label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Complete address"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #456882',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        backgroundColor: '#F9F3EF',
                        color: '#1B3C53',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Owner Information Section */}
              <div className="form-section" style={{
                marginBottom: '32px',
                padding: '24px',
                backgroundColor: '#D2C1B6',
                borderRadius: '8px',
                border: '1px solid #456882'
              }}>
                <h3 style={{
                  color: '#1B3C53',
                  marginBottom: '20px',
                  fontSize: '1.3rem',
                  fontWeight: 600
                }}>Owner Information</h3>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px'}}>
                  <div className="form-group">
                    <label style={{
                      display: 'block',
                      marginBottom: '6px',
                      color: '#1B3C53',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}>Owner Name <span style={{color: '#DC2626'}}>*</span></label>
                    <input
                      type="text"
                      name="ownerName"
                      value={formData.ownerName}
                      onChange={handleInputChange}
                      placeholder="Full name"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #456882',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        backgroundColor: '#F9F3EF',
                        color: '#1B3C53',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{
                      display: 'block',
                      marginBottom: '6px',
                      color: '#1B3C53',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}>Contact Number <span style={{color: '#DC2626'}}>*</span></label>
                    <input
                      type="tel"
                      name="contact"
                      value={formData.contact}
                      onChange={handleInputChange}
                      placeholder="+880 1XXX-XXXXXX"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #456882',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        backgroundColor: '#F9F3EF',
                        color: '#1B3C53',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{
                    display: 'block',
                    marginBottom: '6px',
                    color: '#1B3C53',
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}>Email Address <span style={{color: '#DC2626'}}>*</span></label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="email@example.com"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #456882',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      backgroundColor: '#F9F3EF',
                      color: '#1B3C53',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Account Credentials Section */}
              <div className="form-section" style={{
                marginBottom: '32px',
                padding: '24px',
                backgroundColor: '#D2C1B6',
                borderRadius: '8px',
                border: '1px solid #456882'
              }}>
                <h3 style={{
                  color: '#1B3C53',
                  marginBottom: '20px',
                  fontSize: '1.3rem',
                  fontWeight: 600
                }}>Account Credentials</h3>

                <div className="form-group" style={{marginBottom: '16px'}}>
                  <label style={{
                    display: 'block',
                    marginBottom: '6px',
                    color: '#1B3C53',
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}>Username <span style={{color: '#DC2626'}}>*</span></label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Choose a username"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #456882',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      backgroundColor: '#F9F3EF',
                      color: '#1B3C53',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                  <div className="form-group">
                    <label style={{
                      display: 'block',
                      marginBottom: '6px',
                      color: '#1B3C53',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}>Password <span style={{color: '#DC2626'}}>*</span></label>
                    <div style={{position: 'relative'}}>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Min. 6 characters"
                        required
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid #456882',
                          borderRadius: '8px',
                          fontSize: '0.95rem',
                          backgroundColor: '#F9F3EF',
                          color: '#1B3C53',
                          boxSizing: 'border-box'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '1rem'
                        }}
                      >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label style={{
                      display: 'block',
                      marginBottom: '6px',
                      color: '#1B3C53',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}>Confirm Password <span style={{color: '#DC2626'}}>*</span></label>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Re-enter password"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #456882',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        backgroundColor: '#F9F3EF',
                        color: '#1B3C53',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div style={{
                  backgroundColor: '#FEE2E2',
                  color: '#DC2626',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '24px',
                  fontSize: '0.95rem',
                  textAlign: 'center',
                  border: '1px solid #EF4444'
                }}>
                  {error}
                </div>
              )}

              <div style={{textAlign: 'center'}}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '16px 32px',
                    backgroundColor: '#1B3C53',
                    color: '#F9F3EF',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {loading ? 'Registering...' : 'Complete Registration'}
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
