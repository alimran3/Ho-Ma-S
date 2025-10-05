import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [studentInfo, setStudentInfo] = useState(null);
  const [roommates, setRoommates] = useState([]);
  const [mealHistory, setMealHistory] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [complaint, setComplaint] = useState({
    subject: '',
    description: '',
    category: 'general'
  });

  const complaintCategories = [
    { value: 'general', label: 'General Issue' },
    { value: 'maintenance', label: 'Room Maintenance' },
    { value: 'meal', label: 'Meal Related' },
    { value: 'security', label: 'Security Concern' },
    { value: 'roommate', label: 'Roommate Issue' },
    { value: 'emergency', label: 'Emergency' }
  ];

  useEffect(() => {
    fetchStudentData();
    fetchRoommates();
    fetchMealHistory();
    fetchAttendanceHistory();
  }, []);

  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/student/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudentInfo(response.data);
    } catch (error) {
      console.error('Error fetching student data:', error);
      if (error.response?.status === 401) {
        navigate('/');
      }
    }
  };

  const fetchRoommates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/student/roommates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRoommates(response.data);
    } catch (error) {
      console.error('Error fetching roommates:', error);
    }
  };

  const fetchMealHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/student/meal-history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMealHistory(response.data);
    } catch (error) {
      console.error('Error fetching meal history:', error);
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/student/attendance-history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttendanceHistory(response.data);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
    }
  };

  const handleToggleMeal = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/student/toggle-meal', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchStudentData();
      fetchMealHistory();
    } catch (error) {
      console.error('Error toggling meal:', error);
    }
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/student/complaint', complaint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Complaint submitted successfully!');
      setShowComplaintModal(false);
      setComplaint({ subject: '', description: '', category: 'general' });
    } catch (error) {
      console.error('Error submitting complaint:', error);
      alert('Failed to submit complaint');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="student-dashboard-container">
      {/* Fixed Header */}
      <header className="student-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Student Portal</h1>
            <p>Welcome back, {studentInfo?.fullName || 'Student'}</p>
          </div>
          <div className="header-right">
            <button className="complaint-btn" onClick={() => setShowComplaintModal(true)}>
              <span>📝</span> Submit Complaint
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              <span>🚪</span> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          Personal Info
        </button>
        <button 
          className={`tab-btn ${activeTab === 'meal' ? 'active' : ''}`}
          onClick={() => setActiveTab('meal')}
        >
          Meal Management
        </button>
        <button 
          className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          Attendance
        </button>
        <button 
          className={`tab-btn ${activeTab === 'roommates' ? 'active' : ''}`}
          onClick={() => setActiveTab('roommates')}
        >
          Roommates
        </button>
      </div>

      {/* Main Content Area */}
      <main className="student-main-content">
        {/* Personal Information Tab */}
        {activeTab === 'personal' && (
          <div className="tab-content personal-info-tab">
            <div className="info-card">
              <h2>Personal Details</h2>
              <div className="info-grid">
                <div className="info-item">
                  <label>Full Name</label>
                  <p>{studentInfo?.fullName || 'N/A'}</p>
                </div>
                <div className="info-item">
                  <label>Student ID</label>
                  <p>{studentInfo?.studentId || 'N/A'}</p>
                </div>
                <div className="info-item">
                  <label>Age</label>
                  <p>{studentInfo?.age ? `${studentInfo.age} years` : 'N/A'}</p>
                </div>
                <div className="info-item">
                  <label>Blood Group</label>
                  <p className="blood-group">{studentInfo?.bloodGroup || 'N/A'}</p>
                </div>
                <div className="info-item">
                  <label>Department</label>
                  <p>{studentInfo?.department || 'N/A'}</p>
                </div>
                <div className="info-item">
                  <label>Email</label>
                  <p>{studentInfo?.email || 'N/A'}</p>
                </div>
                <div className="info-item">
                  <label>Phone</label>
                  <p>{studentInfo?.phone || 'N/A'}</p>
                </div>
                <div className="info-item">
                  <label>Emergency Contact</label>
                  <p>{studentInfo?.emergencyContact || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="info-card">
              <h2>Accommodation Details</h2>
              <div className="info-grid">
                <div className="info-item">
                  <label>Hall Name</label>
                  <p>{studentInfo?.hallName || 'N/A'}</p>
                </div>
                <div className="info-item">
                  <label>Room Number</label>
                  <p>{studentInfo?.roomNumber || 'N/A'}</p>
                </div>
                <div className="info-item">
                  <label>Floor</label>
                  <p>Floor {studentInfo?.floorNumber || 'N/A'}</p>
                </div>
                <div className="info-item full-width">
                  <label>Address</label>
                  <p>{studentInfo?.address || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Meal Management Tab */}
        {activeTab === 'meal' && (
          <div className="tab-content meal-tab">
            <div className="meal-status-card">
              <h2>Current Meal Status</h2>
              <div className="meal-status-display">
                <div className={`status-circle ${studentInfo?.mealStatus ? 'on' : 'off'}`}>
                  <span>{studentInfo?.mealStatus ? 'ON' : 'OFF'}</span>
                </div>
                <button className="toggle-meal-btn" onClick={handleToggleMeal}>
                  Turn Meal {studentInfo?.mealStatus ? 'OFF' : 'ON'}
                </button>
              </div>
            </div>

            <div className="meal-history-card">
              <h2>Meal History (Last 7 Days)</h2>
              <div className="history-table">
                {mealHistory.length > 0 ? (
                  mealHistory.slice(0, 7).map((entry, index) => (
                    <div key={index} className="history-row">
                      <span className="date">
                        {new Date(entry.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      <span className={`status-badge ${entry.status ? 'on' : 'off'}`}>
                        {entry.status ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="no-data">No meal history available</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="tab-content attendance-tab">
            <div className="attendance-card">
              <h2>Attendance History</h2>
              <div className="attendance-table">
                {attendanceHistory.length > 0 ? (
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Check In</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceHistory.slice(0, 10).map((entry, index) => (
                          <tr key={index}>
                            <td>{new Date(entry.date).toLocaleDateString()}</td>
                            <td>{entry.checkIn || 'N/A'}</td>
                            <td>
                              <span className={`attendance-status ${entry.isPresent ? 'present' : 'absent'}`}>
                                {entry.isPresent ? 'Present' : 'Absent'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="no-data">No attendance records available</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Roommates Tab */}
        {activeTab === 'roommates' && (
          <div className="tab-content roommates-tab">
            <div className="roommates-card">
              <h2>Your Roommates</h2>
              {roommates.length > 0 ? (
                <div className="roommates-grid">
                  {roommates.map(roommate => (
                    <div key={roommate._id} className="roommate-card">
                      <div className="roommate-avatar">
                        {roommate.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="roommate-info">
                        <h3>{roommate.fullName}</h3>
                        <div className="roommate-details">
                          <p><span>ID:</span> {roommate.studentId}</p>
                          <p><span>Dept:</span> {roommate.department}</p>
                          <p><span>Blood:</span> <span className="blood-type">{roommate.bloodGroup}</span></p>
                          <p><span>Phone:</span> {roommate.phone}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No roommates assigned yet</p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Complaint Modal */}
      {showComplaintModal && (
        <div className="modal-overlay" onClick={() => setShowComplaintModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Submit Complaint / Seek Help</h2>
              <button className="close-btn" onClick={() => setShowComplaintModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmitComplaint} className="complaint-form">
              <div className="form-group">
                <label>Category *</label>
                <select
                  value={complaint.category}
                  onChange={(e) => setComplaint({...complaint, category: e.target.value})}
                  required
                >
                  {complaintCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Subject *</label>
                <input
                  type="text"
                  value={complaint.subject}
                  onChange={(e) => setComplaint({...complaint, subject: e.target.value})}
                  placeholder="Brief subject of your complaint"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={complaint.description}
                  onChange={(e) => setComplaint({...complaint, description: e.target.value})}
                  rows="5"
                  placeholder="Describe your issue in detail..."
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowComplaintModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Submit Complaint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;