import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ManagerDashboard.css';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [managerInfo, setManagerInfo] = useState(null);
  const [activeSection, setActiveSection] = useState('meal');
  const [students, setStudents] = useState([]);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Student registration form
  const [studentData, setStudentData] = useState({
    fullName: '',
    age: '',
    bloodGroup: '',
    department: '',
    studentId: '',
    phone: '',
    email: '',
    roomNumber: '',
    floorNumber: '',
    username: '',
    password: '',
    emergencyContact: '',
    address: ''
  });

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  const departments = ['CSE', 'EEE', 'BBA', 'English', 'Law', 'Medicine', 'Civil Engineering'];

  useEffect(() => {
    fetchManagerData();
    fetchStudents();
  }, []);

  const fetchManagerData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/manager/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setManagerInfo(response.data);
    } catch (error) {
      console.error('Error fetching manager data:', error);
      if (error.response?.status === 401) {
        navigate('/');
      }
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/manager/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching students:', error);
      setLoading(false);
    }
  };

  const handleRegisterStudent = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/manager/register-student',
        studentData,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      alert('Student registered successfully!');
      setShowRegisterModal(false);
      resetStudentForm();
      fetchStudents();
    } catch (error) {
      console.error('Error registering student:', error);
      alert('Failed to register student: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const resetStudentForm = () => {
    setStudentData({
      fullName: '',
      age: '',
      bloodGroup: '',
      department: '',
      studentId: '',
      phone: '',
      email: '',
      roomNumber: '',
      floorNumber: '',
      username: '',
      password: '',
      emergencyContact: '',
      address: ''
    });
  };

  const toggleMealStatus = async (studentId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/manager/toggle-meal/${studentId}`,
        { mealStatus: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      fetchStudents();
    } catch (error) {
      console.error('Error toggling meal status:', error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="manager-dashboard">
      {/* Left Sidebar */}
      <div className="manager-sidebar">
        <div className="sidebar-header">
          <h2>Manager Portal</h2>
        </div>

        <div className="manager-info-card">
          <div className="manager-avatar">
            {managerInfo?.fullName?.charAt(0) || 'M'}
          </div>
          <h3>{managerInfo?.fullName || 'Loading...'}</h3>
          <p className="manager-role">{managerInfo?.rank}</p>
          <div className="manager-details">
            <p><span>📧</span> {managerInfo?.email}</p>
            <p><span>📱</span> {managerInfo?.phone}</p>
            <p><span>🏢</span> {managerInfo?.hallName}</p>
            <p><span>🩸</span> {managerInfo?.bloodGroup}</p>
            <p><span>💰</span> Salary: ৳{managerInfo?.salary}</p>
          </div>
        </div>

        <button 
          className="register-student-btn"
          onClick={() => setShowRegisterModal(true)}
        >
          <span>➕</span> Register New Student
        </button>

        <button className="logout-btn" onClick={handleLogout}>
          <span>🚪</span> Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="manager-main">
        <div className="content-header">
          <h1>Hall Management Dashboard</h1>
          <p>Welcome back, {managerInfo?.fullName}</p>
        </div>

        {/* Section Buttons */}
        <div className="section-buttons">
          <button 
            className={`section-btn ${activeSection === 'meal' ? 'active' : ''}`}
            onClick={() => setActiveSection('meal')}
          >
            🍽️ Meal Management
          </button>
          <button 
            className={`section-btn ${activeSection === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveSection('attendance')}
          >
            📋 Attendance
          </button>
          <button 
            className={`section-btn ${activeSection === 'room' ? 'active' : ''}`}
            onClick={() => setActiveSection('room')}
          >
            🏠 Room Management
          </button>
        </div>

        {/* Content Sections */}
        <div className="content-section">
          {activeSection === 'meal' && (
            <div className="meal-management">
              <h2>Meal Management</h2>
              <div className="students-grid">
                {students.map(student => (
                  <div key={student._id} className="student-meal-card">
                    <h4>{student.fullName}</h4>
                    <p>Room: {student.roomNumber}</p>
                    <p>ID: {student.studentId}</p>
                    <div className="meal-toggle">
                      <span>Meal Status:</span>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={student.mealStatus}
                          onChange={() => toggleMealStatus(student._id, student.mealStatus)}
                        />
                        <span className="slider"></span>
                      </label>
                      <span className={student.mealStatus ? 'on' : 'off'}>
                        {student.mealStatus ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="meal-summary">
                <h3>Today's Meal Count</h3>
                <p className="meal-count">
                  {students.filter(s => s.mealStatus).length} / {students.length} students
                </p>
              </div>
            </div>
          )}

          {activeSection === 'attendance' && (
            <div className="attendance-management">
              <h2>Student Attendance</h2>
              <div className="attendance-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Room</th>
                      <th>Status</th>
                      <th>Last Check-in</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => (
                      <tr key={student._id}>
                        <td>{student.fullName}</td>
                        <td>{student.roomNumber}</td>
                        <td>
                          <span className={`status ${student.isPresent ? 'present' : 'absent'}`}>
                            {student.isPresent ? 'Present' : 'Absent'}
                          </span>
                        </td>
                        <td>{student.lastCheckIn || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === 'room' && (
            <div className="room-management">
              <h2>Room Allocation</h2>
              <div className="room-allocation-grid">
                {students.map(student => (
                  <div key={student._id} className="student-room-card">
                    <h4>{student.fullName}</h4>
                    <div className="room-info">
                      <p><strong>Room:</strong> {student.roomNumber}</p>
                      <p><strong>Floor:</strong> {student.floorNumber}</p>
                      <p><strong>Department:</strong> {student.department}</p>
                    </div>
                    <button className="edit-room-btn">
                      Edit Allocation
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Register Student Modal */}
      {showRegisterModal && (
        <div className="modal-overlay" onClick={() => setShowRegisterModal(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Register New Student</h2>
              <button className="close-btn" onClick={() => setShowRegisterModal(false)}>×</button>
            </div>
            <form onSubmit={handleRegisterStudent} className="student-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={studentData.fullName}
                    onChange={(e) => setStudentData({...studentData, fullName: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Age *</label>
                  <input
                    type="number"
                    value={studentData.age}
                    onChange={(e) => setStudentData({...studentData, age: e.target.value})}
                    min="16"
                    max="30"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Blood Group *</label>
                  <select
                    value={studentData.bloodGroup}
                    onChange={(e) => setStudentData({...studentData, bloodGroup: e.target.value})}
                    required
                  >
                    <option value="">Select Blood Group</option>
                    {bloodGroups.map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Department *</label>
                  <select
                    value={studentData.department}
                    onChange={(e) => setStudentData({...studentData, department: e.target.value})}
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Student ID *</label>
                  <input
                    type="text"
                    value={studentData.studentId}
                    onChange={(e) => setStudentData({...studentData, studentId: e.target.value})}
                    placeholder="University ID"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    value={studentData.phone}
                    onChange={(e) => setStudentData({...studentData, phone: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={studentData.email}
                    onChange={(e) => setStudentData({...studentData, email: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Emergency Contact *</label>
                  <input
                    type="tel"
                    value={studentData.emergencyContact}
                    onChange={(e) => setStudentData({...studentData, emergencyContact: e.target.value})}
                    placeholder="Parent/Guardian contact"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Room Number *</label>
                  <input
                    type="text"
                    value={studentData.roomNumber}
                    onChange={(e) => setStudentData({...studentData, roomNumber: e.target.value})}
                    placeholder="e.g., 101"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Floor Number *</label>
                  <input
                    type="number"
                    value={studentData.floorNumber}
                    onChange={(e) => setStudentData({...studentData, floorNumber: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label>Address *</label>
                  <textarea
                    value={studentData.address}
                    onChange={(e) => setStudentData({...studentData, address: e.target.value})}
                    rows="2"
                    required
                  />
                </div>

                <div className="form-section-divider">
                  <h3>Login Credentials</h3>
                </div>

                <div className="form-group">
                  <label>Username *</label>
                  <input
                    type="text"
                    value={studentData.username}
                    onChange={(e) => setStudentData({...studentData, username: e.target.value})}
                    placeholder="Create username"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    value={studentData.password}
                    onChange={(e) => setStudentData({...studentData, password: e.target.value})}
                    placeholder="Create password"
                    minLength="6"
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowRegisterModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Register Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;