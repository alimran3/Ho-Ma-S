import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CreateHallModal from './CreateHallModal';
import HallCard from './HallCard';
import './OwnerDashboard.css';
import { FaHotel } from "react-icons/fa6";
import { SiBookmeter } from "react-icons/si";
import { FcManager } from "react-icons/fc";





axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    console.log('API Response Success:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });

    if (error.response?.status === 401) {
      console.log('Authentication failed, redirecting to login...');
      localStorage.clear();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [ownerInfo, setOwnerInfo] = useState(null);
  const [halls, setHalls] = useState([]);
  const [stats, setStats] = useState({
    totalHalls: 0,
    totalRooms: 0,
    totalCapacity: 0,
    occupiedRooms: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('dashboard');
  const [reportsData, setReportsData] = useState(null);
  const [managers, setManagers] = useState([]);
  const [students, setStudents] = useState([]);
  const [managersLoading, setManagersLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);

  useEffect(() => {
    // Check authentication before fetching data
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    
    console.log('Dashboard Mount - Token:', token ? 'Exists' : 'Missing');
    console.log('Dashboard Mount - UserType:', userType);

    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/');
      return;
    }

    if (userType !== 'owner') {
      console.log('User type is not owner, redirecting');
      navigate('/');
      return;
    }

    fetchDashboardData();
  }, [navigate]);

  
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Starting to fetch dashboard data...');

      const [ownerRes, hallsRes, statsRes] = await Promise.all([
        axios.get('/api/owner/profile'),
        axios.get('/api/halls'),
        axios.get('/api/owner/stats'),
      ]);

      console.log('Data fetched successfully:', {
        owner: ownerRes.data,
        halls: hallsRes.data,
        stats: statsRes.data
      });

      setOwnerInfo(ownerRes.data);
      setHalls(hallsRes.data);
      setStats(statsRes.data);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      // Don't handle 401 here - let interceptor handle it
      if (error.response?.status === 403) {
        setError('Access denied. You do not have permission to view this page.');
      } else if (error.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR') {
        setError('Network error. Please check your connection.');
      } else {
        setError('Failed to load dashboard data: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Create Hall
  // ---------------------------
  const handleCreateHall = async (hallData) => {
    try {
      console.log('Creating hall:', hallData);
      await axios.post('/api/halls/create', hallData);
      setShowCreateModal(false);
      // Refresh the data
      await fetchDashboardData();
    } catch (error) {
      console.error('Error creating hall:', error);
      alert('Failed to create hall: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  // ---------------------------
  // Logout
  // ---------------------------
  const handleLogout = () => {
    console.log('Logging out...');
    localStorage.clear();
    navigate('/');
  };

  // ---------------------------
  // Occupancy Rate Helper
  // ---------------------------
  const getOccupancyRate = () => {
    if (!stats.totalRooms) return 0;
    return Math.round((stats.occupiedRooms / stats.totalRooms) * 100);
  };

  // ---------------------------
  // Fetch Reports Data
  // ---------------------------
  const fetchReportsData = async () => {
    try {
      console.log('Fetching reports data...');
      const [mealStatsRes, paymentStatsRes, hallStatsRes] = await Promise.all([
        axios.get('/api/owner/meal-stats'),
        axios.get('/api/owner/payment-stats'),
        axios.get('/api/owner/hall-stats'),
      ]);

      setReportsData({
        mealStats: mealStatsRes.data,
        paymentStats: paymentStatsRes.data,
        hallStats: hallStatsRes.data,
      });
    } catch (error) {
      console.error('Error fetching reports data:', error);
      setError('Failed to load reports data');
    }
  };

  // ---------------------------
  // Fetch Managers Data
  // ---------------------------
  const fetchManagers = async () => {
    try {
      setManagersLoading(true);
      const res = await axios.get('/api/owner/managers');
      setManagers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error fetching managers:', error);
      setError('Failed to load managers data');
    } finally {
      setManagersLoading(false);
    }
  };

  // ---------------------------
  // Fetch Students Data
  // ---------------------------
  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);
      const res = await axios.get('/api/owner/students');
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to load students data');
    } finally {
      setStudentsLoading(false);
    }
  };

  // ---------------------------
  // JSX
  // ---------------------------
  return (
    <div className="owner-dashboard">
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">
            <span className="logo-icon"><FaHotel /></span>
            {!sidebarCollapsed && <span className="logo-text">HMS</span>}
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            <li className="nav-item">
              <button
                className={`nav-link ${activeSection === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveSection('dashboard')}
              >
                <span className="nav-icon">D</span>
                {!sidebarCollapsed && <span className="nav-text">Dashboard</span>}
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeSection === 'halls' ? 'active' : ''}`}
                onClick={() => setActiveSection('halls')}
              >
                <span className="nav-icon">H</span>
                {!sidebarCollapsed && <span className="nav-text">Halls</span>}
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeSection === 'managers' ? 'active' : ''}`}
                onClick={() => {
                  setActiveSection('managers');
                  fetchManagers();
                }}
              >
                <span className="nav-icon">M</span>
                {!sidebarCollapsed && <span className="nav-text">Managers</span>}
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeSection === 'students' ? 'active' : ''}`}
                onClick={() => {
                  setActiveSection('students');
                  fetchStudents();
                }}
              >
                <span className="nav-icon">S</span>
                {!sidebarCollapsed && <span className="nav-text">Students</span>}
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeSection === 'reports' ? 'active' : ''}`}
                onClick={() => {
                  setActiveSection('reports');
                  fetchReportsData();
                }}
              >
                <span className="nav-icon">R</span>
                {!sidebarCollapsed && <span className="nav-text">Reports</span>}
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeSection === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveSection('settings')}
              >
                <span className="nav-icon">T</span>
                {!sidebarCollapsed && <span className="nav-text">Settings</span>}
              </button>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              {ownerInfo?.ownerName?.charAt(0)?.toUpperCase() || 'O'}
            </div>
            {!sidebarCollapsed && (
              <div className="user-info">
                <p className="user-name">{ownerInfo?.ownerName || 'Loading...'}</p>
                <p className="user-role">Institute Owner</p>
              </div>
            )}
          </div>
          <button className="logout-button" onClick={handleLogout}>
            <span className="logout-icon">L</span>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-left">
            <h1 className="page-title">
              {activeSection === 'dashboard' && 'Dashboard Overview'}
              {activeSection === 'halls' && 'Hall Management'}
              {activeSection === 'managers' && 'Manager Management'}
              {activeSection === 'students' && 'Student Management'}
              {activeSection === 'reports' && 'Reports & Analytics'}
              {activeSection === 'settings' && 'Settings'}
            </h1>
            <p className="page-subtitle">
              {loading ? 'Loading...' : `Welcome back, ${ownerInfo?.ownerName || 'Owner'}`}
            </p>
          </div>
          <div className="header-right">
          <div className="institute-badge">
              <span className="badge-icon">I</span>
              <div className="badge-info">
                <p className="institute-name">{ownerInfo?.instituteName || 'Institute'}</p>
                <p className="institute-id">EIIN: {ownerInfo?.eiin || 'Loading...'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Error Display */}
        {error && (
          <div className="error-banner">
            {error}
            <button onClick={() => setError('')} className="error-close">×</button>
          </div>
        )}

        {/* Dynamic Content Sections */}
        {activeSection === 'dashboard' && (
          <>
        {/* Stats */}
        <section className="stats-grid">
          {[
            { title: 'Total Halls', value: stats.totalHalls, icon: 'H', color: '#456882' },
            { title: 'Total Rooms', value: stats.totalRooms, icon: 'R', color: '#456882' },
            { title: 'Total Capacity', value: stats.totalCapacity, icon: 'C', color: '#456882' },
            { title: 'Occupancy Rate', value: getOccupancyRate() + '%', icon: 'O', color: '#456882' },
          ].map((stat, idx) => (
            <div key={idx} className="stat-card">
              <div className="stat-icon" style={{ background: stat.color }}>
                {stat.icon}
              </div>
              <div className="stat-content">
                <h3 className="stat-number">{stat.value}</h3>
                <p className="stat-title">{stat.title}</p>
              </div>
            </div>
          ))}
        </section>

            {/* Halls Section */}
            <section className="halls-section">
              <div className="section-header">
                <h2>Hall Management</h2>
                <button
                  className="btn-primary"
                  onClick={() => setShowCreateModal(true)}
                  disabled={loading}
                >
                  + Create New Hall
                </button>
              </div>

              {loading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading halls...</p>
                </div>
              ) : halls.length === 0 ? (
                <div className="empty-state">
                  <p>No halls created yet. Create your first hall to get started.</p>
                </div>
              ) : (
                <div className="halls-grid">
                  {Array.isArray(halls) && halls.map(hall => (
                    <HallCard
                      key={hall._id}
                      hall={hall}
                      onClick={() => navigate(`/owner/hall/${hall._id}`)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {activeSection === 'halls' && (
          <section className="halls-section">
            <div className="section-header">
              <h2>Hall Management</h2>
              <button
                className="btn-primary"
                onClick={() => setShowCreateModal(true)}
                disabled={loading}
              >
                + Create New Hall
              </button>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading halls...</p>
              </div>
            ) : halls.length === 0 ? (
              <div className="empty-state">
                <p>No halls created yet. Create your first hall to get started.</p>
              </div>
            ) : (
              <div className="halls-grid">
                {Array.isArray(halls) && halls.map(hall => (
                  <HallCard
                    key={hall._id}
                    hall={hall}
                    onClick={() => navigate(`/owner/hall/${hall._id}`)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {activeSection === 'reports' && (
          <section className="reports-section">
            <div className="section-header">
              <h2>Reports & Analytics</h2>
              <button
                className="btn-secondary"
                onClick={fetchReportsData}
              >
                Refresh Reports
              </button>
            </div>

            {reportsData ? (
              <div className="reports-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '24px',
                marginTop: '24px'
              }}>
                <div style={{
                  backgroundColor: '#F9F3EF',
                  border: '1px solid #456882',
                  borderRadius: '12px',
                  padding: '32px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    backgroundColor: '#1B3C53'
                  }}></div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '24px'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#1B3C53',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#F9F3EF',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      marginRight: '16px'
                    }}>🍽️</div>
                    <h3 style={{
                      margin: 0,
                      fontSize: '24px',
                      fontWeight: 600,
                      color: '#1B3C53',
                      letterSpacing: '-0.01em'
                    }}>Meal Statistics</h3>
                  </div>
                  <div style={{display: 'grid', gap: '16px'}}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px 20px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #D2C1B6'
                    }}>
                      <span style={{fontWeight: 600, color: '#456882', fontSize: '16px'}}>Total Meals Served:</span>
                      <span style={{color: '#1B3C53', fontSize: '18px', fontWeight: 700}}>{reportsData.mealStats?.totalMeals || 0}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px 20px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #D2C1B6'
                    }}>
                      <span style={{fontWeight: 600, color: '#456882', fontSize: '16px'}}>Revenue:</span>
                      <span style={{color: '#1B3C53', fontSize: '18px', fontWeight: 700}}>৳{reportsData.mealStats?.totalRevenue || 0}</span>
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: '12px',
                      marginTop: '8px'
                    }}>
                      <div style={{
                        textAlign: 'center',
                        padding: '16px 12px',
                        backgroundColor: '#D2C1B6',
                        borderRadius: '8px',
                        border: '1px solid #456882'
                      }}>
                        <div style={{fontSize: '12px', color: '#456882', marginBottom: '4px', fontWeight: 500}}>Breakfast</div>
                        <div style={{fontSize: '20px', fontWeight: 700, color: '#1B3C53'}}>{reportsData.mealStats?.breakfast || 0}</div>
                      </div>
                      <div style={{
                        textAlign: 'center',
                        padding: '16px 12px',
                        backgroundColor: '#D2C1B6',
                        borderRadius: '8px',
                        border: '1px solid #456882'
                      }}>
                        <div style={{fontSize: '12px', color: '#456882', marginBottom: '4px', fontWeight: 500}}>Lunch</div>
                        <div style={{fontSize: '20px', fontWeight: 700, color: '#1B3C53'}}>{reportsData.mealStats?.lunch || 0}</div>
                      </div>
                      <div style={{
                        textAlign: 'center',
                        padding: '16px 12px',
                        backgroundColor: '#D2C1B6',
                        borderRadius: '8px',
                        border: '1px solid #456882'
                      }}>
                        <div style={{fontSize: '12px', color: '#456882', marginBottom: '4px', fontWeight: 500}}>Dinner</div>
                        <div style={{fontSize: '20px', fontWeight: 700, color: '#1B3C53'}}>{reportsData.mealStats?.dinner || 0}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#F9F3EF',
                  border: '1px solid #456882',
                  borderRadius: '12px',
                  padding: '32px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    backgroundColor: '#1B3C53'
                  }}></div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '24px'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#1B3C53',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#F9F3EF',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      marginRight: '16px'
                    }}>💳</div>
                    <h3 style={{
                      margin: 0,
                      fontSize: '24px',
                      fontWeight: 600,
                      color: '#1B3C53',
                      letterSpacing: '-0.01em'
                    }}>Payment Statistics</h3>
                  </div>
                  <div style={{display: 'grid', gap: '16px'}}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px 20px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #D2C1B6'
                    }}>
                      <span style={{fontWeight: 600, color: '#456882', fontSize: '16px'}}>Total Payments:</span>
                      <span style={{color: '#1B3C53', fontSize: '18px', fontWeight: 700}}>{reportsData.paymentStats?.totalPayments || 0}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px 20px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #D2C1B6'
                    }}>
                      <span style={{fontWeight: 600, color: '#456882', fontSize: '16px'}}>Total Amount:</span>
                      <span style={{color: '#1B3C53', fontSize: '18px', fontWeight: 700}}>৳{reportsData.paymentStats?.totalAmount || 0}</span>
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                      marginTop: '8px'
                    }}>
                      <div style={{
                        textAlign: 'center',
                        padding: '20px 16px',
                        backgroundColor: '#FEE2E2',
                        borderRadius: '8px',
                        border: '1px solid #EF4444'
                      }}>
                        <div style={{fontSize: '12px', color: '#991B1B', marginBottom: '4px', fontWeight: 500}}>Pending</div>
                        <div style={{fontSize: '24px', fontWeight: 700, color: '#991B1B'}}>{reportsData.paymentStats?.pending || 0}</div>
                      </div>
                      <div style={{
                        textAlign: 'center',
                        padding: '20px 16px',
                        backgroundColor: '#D1FAE5',
                        borderRadius: '8px',
                        border: '1px solid #10B981'
                      }}>
                        <div style={{fontSize: '12px', color: '#065F46', marginBottom: '4px', fontWeight: 500}}>Received</div>
                        <div style={{fontSize: '24px', fontWeight: 700, color: '#065F46'}}>{reportsData.paymentStats?.received || 0}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#F9F3EF',
                  border: '1px solid #456882',
                  borderRadius: '12px',
                  padding: '32px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    backgroundColor: '#1B3C53'
                  }}></div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '24px'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#1B3C53',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#F9F3EF',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      marginRight: '16px'
                    }}>🏢</div>
                    <h3 style={{
                      margin: 0,
                      fontSize: '24px',
                      fontWeight: 600,
                      color: '#1B3C53',
                      letterSpacing: '-0.01em'
                    }}>Hall Statistics</h3>
                  </div>
                  <div style={{display: 'grid', gap: '16px'}}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px 20px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #D2C1B6'
                    }}>
                      <span style={{fontWeight: 600, color: '#456882', fontSize: '16px'}}>Total Halls:</span>
                      <span style={{color: '#1B3C53', fontSize: '18px', fontWeight: 700}}>{reportsData.hallStats?.totalHalls || 0}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px 20px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #D2C1B6'
                    }}>
                      <span style={{fontWeight: 600, color: '#456882', fontSize: '16px'}}>Total Rooms:</span>
                      <span style={{color: '#1B3C53', fontSize: '18px', fontWeight: 700}}>{reportsData.hallStats?.totalRooms || 0}</span>
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                      marginTop: '8px'
                    }}>
                      <div style={{
                        textAlign: 'center',
                        padding: '20px 16px',
                        backgroundColor: '#D1FAE5',
                        borderRadius: '8px',
                        border: '1px solid #10B981'
                      }}>
                        <div style={{fontSize: '12px', color: '#065F46', marginBottom: '4px', fontWeight: 500}}>Occupied</div>
                        <div style={{fontSize: '24px', fontWeight: 700, color: '#065F46'}}>{reportsData.hallStats?.occupiedRooms || 0}</div>
                      </div>
                      <div style={{
                        textAlign: 'center',
                        padding: '20px 16px',
                        backgroundColor: '#DBEAFE',
                        borderRadius: '8px',
                        border: '1px solid #3B82F6'
                      }}>
                        <div style={{fontSize: '12px', color: '#1E40AF', marginBottom: '4px', fontWeight: 500}}>Vacant</div>
                        <div style={{fontSize: '24px', fontWeight: 700, color: '#1E40AF'}}>{reportsData.hallStats?.vacantRooms || 0}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading reports...</p>
              </div>
            )}
          </section>
        )}

        {activeSection === 'managers' && (
          <section className="managers-section">
            <div className="section-header">
              <h2>Manager Management</h2>
              <button
                className="btn-secondary"
                onClick={fetchManagers}
                disabled={managersLoading}
              >
                {managersLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {managersLoading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading managers...</p>
              </div>
            ) : managers.length === 0 ? (
              <div className="empty-state">
                <p>No managers found.</p>
              </div>
            ) : (
              <div className="managers-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px'}}>
                {managers.map(manager => (
                  <div key={manager._id} style={{
                    backgroundColor: '#F9F3EF',
                    border: '1px solid #456882',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                    position: 'relative'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '16px'
                    }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        backgroundColor: '#1B3C53',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#F9F3EF',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        marginRight: '16px'
                      }}>
                        {manager.fullName?.charAt(0)?.toUpperCase() || 'M'}
                      </div>
                      <div>
                        <h4 style={{
                          margin: 0,
                          fontSize: '18px',
                          fontWeight: 600,
                          color: '#1B3C53'
                        }}>{manager.fullName}</h4>
                        <p style={{
                          margin: '4px 0 0 0',
                          color: '#456882',
                          fontSize: '14px'
                        }}>{manager.rank}</p>
                      </div>
                    </div>

                    <div style={{display: 'grid', gap: '12px'}}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '8px',
                        border: '1px solid #D2C1B6'
                      }}>
                        <span style={{fontWeight: 600, color: '#456882', fontSize: '14px'}}>Email:</span>
                        <span style={{color: '#1B3C53', fontSize: '14px'}}>{manager.email}</span>
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '8px',
                        border: '1px solid #D2C1B6'
                      }}>
                        <span style={{fontWeight: 600, color: '#456882', fontSize: '14px'}}>Phone:</span>
                        <span style={{color: '#1B3C53', fontSize: '14px'}}>{manager.phone}</span>
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '8px',
                        border: '1px solid #D2C1B6'
                      }}>
                        <span style={{fontWeight: 600, color: '#456882', fontSize: '14px'}}>Hall:</span>
                        <span style={{color: '#1B3C53', fontSize: '14px'}}>{manager.hallName}</span>
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '8px',
                        border: '1px solid #D2C1B6'
                      }}>
                        <span style={{fontWeight: 600, color: '#456882', fontSize: '14px'}}>Salary:</span>
                        <span style={{color: '#1B3C53', fontSize: '14px', fontWeight: 600}}>৳{manager.salary}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeSection === 'students' && (
          <section className="students-section">
            <div className="section-header">
              <h2>Student Management</h2>
              <button
                className="btn-secondary"
                onClick={fetchStudents}
                disabled={studentsLoading}
              >
                {studentsLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {studentsLoading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading students...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="empty-state">
                <p>No students found.</p>
              </div>
            ) : (
              <div className="students-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px'}}>
                {students.map(student => (
                  <div key={student._id} style={{
                    backgroundColor: '#F9F3EF',
                    border: '1px solid #456882',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                    position: 'relative'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '16px'
                    }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        backgroundColor: '#1B3C53',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#F9F3EF',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        marginRight: '16px'
                      }}>
                        {student.fullName?.charAt(0)?.toUpperCase() || 'S'}
                      </div>
                      <div>
                        <h4 style={{
                          margin: 0,
                          fontSize: '18px',
                          fontWeight: 600,
                          color: '#1B3C53'
                        }}>{student.fullName}</h4>
                        <p style={{
                          margin: '4px 0 0 0',
                          color: '#456882',
                          fontSize: '14px'
                        }}>{student.studentId}</p>
                      </div>
                    </div>

                    <div style={{display: 'grid', gap: '12px'}}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '8px',
                        border: '1px solid #D2C1B6'
                      }}>
                        <span style={{fontWeight: 600, color: '#456882', fontSize: '14px'}}>Room:</span>
                        <span style={{color: '#1B3C53', fontSize: '14px'}}>{student.roomNumber}</span>
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '8px',
                        border: '1px solid #D2C1B6'
                      }}>
                        <span style={{fontWeight: 600, color: '#456882', fontSize: '14px'}}>Department:</span>
                        <span style={{color: '#1B3C53', fontSize: '14px'}}>{student.department}</span>
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '8px',
                        border: '1px solid #D2C1B6'
                      }}>
                        <span style={{fontWeight: 600, color: '#456882', fontSize: '14px'}}>Email:</span>
                        <span style={{color: '#1B3C53', fontSize: '14px'}}>{student.email}</span>
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '8px',
                        border: '1px solid #D2C1B6'
                      }}>
                        <span style={{fontWeight: 600, color: '#456882', fontSize: '14px'}}>Phone:</span>
                        <span style={{color: '#1B3C53', fontSize: '14px'}}>{student.phone}</span>
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: student.mealStatus ? '#D1FAE5' : '#FEE2E2',
                        borderRadius: '8px',
                        border: `1px solid ${student.mealStatus ? '#10B981' : '#EF4444'}`
                      }}>
                        <span style={{fontWeight: 600, color: student.mealStatus ? '#065F46' : '#991B1B', fontSize: '14px'}}>Status:</span>
                        <span style={{
                          color: student.mealStatus ? '#065F46' : '#991B1B',
                          fontSize: '14px',
                          fontWeight: 600
                        }}>{student.mealStatus ? 'Active' : 'Inactive'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeSection === 'settings' && (
          <section className="settings-section">
            <div className="section-header">
              <h2>Settings</h2>
            </div>
            <div className="settings-content">
              <div className="settings-card">
                <h3>Profile Settings</h3>
                <p>Update your profile information and preferences.</p>
                <button className="btn-secondary">Edit Profile</button>
              </div>
              <div className="settings-card">
                <h3>System Settings</h3>
                <p>Configure system-wide settings and preferences.</p>
                <button className="btn-secondary">System Config</button>
              </div>
              <div className="settings-card">
                <h3>Security Settings</h3>
                <p>Manage passwords and security preferences.</p>
                <button className="btn-secondary">Security</button>
              </div>
            </div>
          </section>
        )}
      </main>

      {showCreateModal && (
        <CreateHallModal 
          onClose={() => setShowCreateModal(false)} 
          onCreate={handleCreateHall} 
        />
      )}
    </div>
  );
};

export default OwnerDashboard;