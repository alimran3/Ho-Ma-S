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
            {['Dashboard', 'Halls', 'Managers', 'Students', 'Reports', 'Settings'].map((item, index) => (
              <li key={index} className="nav-item">
                <button 
                  className="nav-link"
                  onClick={() => {
                    // Add navigation logic here
                    console.log(`Navigating to ${item}`);
                  }}
                >
                  <span className="nav-icon">
                    {item === 'Dashboard' ? '🏠' : 
                     item === 'Halls' ? <FaHotel /> : 
                     item === 'Managers' ? <FcManager /> : 
                     item === 'Students' ? '👥' : 
                     item === 'Reports' ? <SiBookmeter /> : '⚙️'}
                  </span>
                  {!sidebarCollapsed && <span className="nav-text">{item}</span>}
                </button>
              </li>
            ))}
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
            <span className="logout-icon">🚪</span>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-left">
            <h1 className="page-title">Dashboard Overview</h1>
            <p className="page-subtitle">
              {loading ? 'Loading...' : `Welcome back, ${ownerInfo?.ownerName || 'Owner'}`}
            </p>
          </div>
          <div className="header-right">
            <div className="institute-badge">
              <span className="badge-icon">🎓</span>
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
            ⚠️ {error}
            <button onClick={() => setError('')} className="error-close">×</button>
          </div>
        )}

        {/* Stats */}
        <section className="stats-grid">
          {[
            { title: 'Total Halls', value: stats.totalHalls, icon: <FaHotel />, color: 'gray' },
            { title: 'Total Rooms', value: stats.totalRooms, icon: '🚪', color: '#48bb78' },
            { title: 'Total Capacity', value: stats.totalCapacity, icon: '👥', color: '#ed8936' },
            { title: 'Occupancy Rate', value: getOccupancyRate() + '%', icon: '📊', color: '#e53e3e' },
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