import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import './StudentDashboard.css';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [studentInfo, setStudentInfo] = useState(null);
  const [roommates, setRoommates] = useState([]);
  const [mealHistory, setMealHistory] = useState([]);
  const [todayMenu, setTodayMenu] = useState({ meals: { breakfast: [], lunch: [], dinner: [] }, mealPrices: { breakfast: 0, lunch: 0, dinner: 0 }, defaultApplied: false });
  const [selection, setSelection] = useState({ breakfast: true, lunch: false, dinner: false });

  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [complaint, setComplaint] = useState({
    subject: '',
    description: '',
    category: 'general'
  });

  const complaintCategories = [
    { value: 'general', label: 'General Issue' },
    { value: 'maintenance', label: 'Room Maintenance' },
    { value: 'meal', label: 'Meal Related' }
  ];

  useEffect(() => {
    fetchStudentData();
    fetchRoommates();
    fetchMealHistory();
    fetchTodayMenu();
    fetchTodaySelection();
    fetchAttendanceHistory();
    // Handle payment result from SSLCommerz redirect
    try {
      const params = new URLSearchParams(window.location.search);
      const payment = params.get('payment');
      if (payment === 'success') alert('Payment successful');
      else if (payment === 'failed') alert('Payment failed');
      else if (payment === 'cancelled') alert('Payment cancelled');
    } catch {}
  }, []);

  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/student/profile', {
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

  const fetchTodaySelection = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/student/meals/today', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelection({
        breakfast: true,
        lunch: response.data.lunch !== undefined ? !!response.data.lunch : true,
        dinner: response.data.dinner !== undefined ? !!response.data.dinner : true,
      });
    } catch (error) {
      console.error('Error fetching today selection:', error);
    }
  };

  const toggleMealStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/student/toggle-meal', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchStudentData();
      await fetchTodaySelection();
      alert(`Meal status ${studentInfo?.mealStatus ? 'turned OFF' : 'turned ON'}`);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to toggle meal status');
    }
  };

  const fetchRoommates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/student/roommates', {
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
      const response = await axios.get('/api/student/meals/history?days=30', {
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
      const response = await axios.get('/api/student/attendance-history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttendanceHistory(response.data);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
    }
  };

  const fetchTodayMenu = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/student/menu', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTodayMenu(response.data);
    } catch (error) {
      console.error('Error fetching today menu:', error);
    }
  };

  const isLocked = () => {
    const now = new Date();
    const hour = now.getHours();
    // Allowed window: 22:00 - 10:59
    const allowed = (hour >= 22) || (hour < 11);
    return !allowed;
  };

  const saveSelection = async () => {
    try {
      const token = localStorage.getItem('token');
      const payload = { ...selection, breakfast: true };
      await axios.put('/api/student/meals/select', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Meal selection saved successfully!');
      await fetchMealHistory();
      await fetchTodaySelection();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save selection');
    }
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const allowed = ['general','maintenance','meal'];
      const payload = {
        subject: (complaint.subject || '').trim(),
        description: (complaint.description || '').trim(),
        category: allowed.includes(complaint.category) ? complaint.category : 'general'
      };
      await axios.post('/api/student/complaint', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Complaint submitted successfully!');
      setShowComplaintModal(false);
      setComplaint({ subject: '', description: '', category: 'general' });
    } catch (error) {
      console.error('Error submitting complaint:', error);
      alert(error.response?.data?.message || 'Failed to submit complaint');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handlePayNow = async () => {
    try {
      const amt = Number(paymentAmount);
      if (!amt || amt <= 0) return alert('Enter a valid amount');
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/payment/init', { amount: amt, method: paymentMethod }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        alert(res.data?.message || 'Failed to initiate payment');
      }
    } catch (e) {
      const detail = e.response?.data?.detail ? `\nDetail: ${JSON.stringify(e.response.data.detail)}` : '';
      alert((e.response?.data?.message || 'Failed to initiate payment') + detail);
    }
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

            <div className="meal-history-card">
              <h2>Pay Mess Bill</h2>
              <div className="history-table" style={{padding:12}}>
                <div style={{display:'flex', gap:10, alignItems:'center', flexWrap:'wrap'}}>
                  <label>Amount (BDT)
                    <input type="number" min="1" value={paymentAmount} onChange={(e)=>setPaymentAmount(e.target.value)} style={{marginLeft:8, width:160}} />
                  </label>
                  <label>Method
                    <select value={paymentMethod} onChange={(e)=>setPaymentMethod(e.target.value)} style={{marginLeft:8}}>
                      <option value="bkash">bKash</option>
                      <option value="nagad">Nagad</option>
                      <option value="visa">Visa</option>
                      <option value="master">Mastercard</option>
                      <option value="amex">Amex</option>
                    </select>
                  </label>
                  <button className="toggle-meal-btn" onClick={handlePayNow}>Pay Now</button>
                </div>
                <div style={{marginTop:8, color:'#6b7280', fontSize:12}}>You will be redirected to SSLCommerz to complete the payment.</div>
              </div>
            </div>
          </div>
        )}

        {/* Meal Management Tab */}
        {activeTab === 'meal' && (
          <div className="tab-content meal-tab">
            <div className="meal-status-card" style={{marginBottom:20}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                <h2 style={{margin:0}}>Master Meal Control</h2>
                <div style={{display:'flex', alignItems:'center', gap:15}}>
                  <span style={{fontSize:'1.1rem', fontWeight:400}}>All Meals: </span>
                  <label className="toggle-switch" style={{transform:'scale(1.2)'}}>
                    <input
                      type="checkbox"
                      checked={studentInfo?.mealStatus}
                      onChange={toggleMealStatus}
                    />
                    <span className="slider"></span>
                  </label>
                  <span style={{fontSize:'1.1rem', fontWeight:600, color: studentInfo?.mealStatus ? '#38a169' : '#e53e3e'}}>
                    {studentInfo?.mealStatus ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
              <p style={{margin:0, color:'#718096', fontSize:'0.95rem'}}>
                {studentInfo?.mealStatus 
                  ? 'Your meals are currently active. You can customize lunch and dinner below.' 
                  : 'All meals are turned OFF. Turn ON to start receiving meals.'}
              </p>
            </div>

            <div className="meal-status-card">
              <h2>Today's Menu</h2>
              <div className="meal-status-display">
                <div className="menu-items-view">
                  <div className="menu-block">
                    <div className="menu-block-header"><strong>Breakfast</strong> — ৳{todayMenu.mealPrices?.breakfast || 0}</div>
                    <div className="menu-items">
                      {(todayMenu.meals?.breakfast || []).length === 0 ? <em>No items</em> : (todayMenu.meals.breakfast).map((it, idx) => (
                        <span key={idx} className="facility-badge">{it.name} ({it.price})</span>
                      ))}
                    </div>
                  </div>
                  <div className="menu-block">
                    <div className="menu-block-header"><strong>Lunch</strong> — ৳{todayMenu.mealPrices?.lunch || 0}</div>
                    <div className="menu-items">
                      {(todayMenu.meals?.lunch || []).length === 0 ? <em>No items</em> : (todayMenu.meals.lunch).map((it, idx) => (
                        <span key={idx} className="facility-badge">{it.name} ({it.price})</span>
                      ))}
                    </div>
                  </div>
                  <div className="menu-block">
                    <div className="menu-block-header"><strong>Dinner</strong> — ৳{todayMenu.mealPrices?.dinner || 0}</div>
                    <div className="menu-items">
                      {(todayMenu.meals?.dinner || []).length === 0 ? <em>No items</em> : (todayMenu.meals.dinner).map((it, idx) => (
                        <span key={idx} className="facility-badge">{it.name} ({it.price})</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="meal-toggle-group">
                  <label>
                    <input type="checkbox" checked={studentInfo?.mealStatus && true} disabled={true} /> Breakfast (mandatory)
                  </label>
                  <label>
                    <input type="checkbox" checked={studentInfo?.mealStatus && selection.lunch} disabled={!studentInfo?.mealStatus || isLocked()} onChange={(e) => setSelection({ ...selection, lunch: e.target.checked })} /> Lunch
                  </label>
                  <label>
                    <input type="checkbox" checked={studentInfo?.mealStatus && selection.dinner} disabled={!studentInfo?.mealStatus || isLocked()} onChange={(e) => setSelection({ ...selection, dinner: e.target.checked })} /> Dinner
                  </label>
                </div>
                <div style={{marginTop:8, color:(!studentInfo?.mealStatus || isLocked())? '#b91c1c':'#4b5563'}}>
                  {!studentInfo?.mealStatus 
                    ? 'Turn ON master meal control to select meals.' 
                    : isLocked() 
                      ? 'Selections are available between 10:00 PM and 11:00 AM.' 
                      : 'All meals are ON by default. Uncheck lunch/dinner to turn them OFF.'}
                </div>
                <button className="toggle-meal-btn" onClick={saveSelection} disabled={!studentInfo?.mealStatus || isLocked()}>
                  {!studentInfo?.mealStatus ? 'Meals Turned OFF' : isLocked() ? 'Selection Locked' : 'Save Selection'}
                </button>
              </div>
            </div>

            <div className="meal-history-card">
              <h2>Meal History (Last 7 Days)</h2>
              <div className="history-table">
                {mealHistory.length > 0 ? (
                  <>
                    {mealHistory.slice(0, 7).map((entry, index) => (
                      <div key={index} className="history-row">
                        <span className="date">
                          {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span>
                          B:{entry.meals.breakfast ? '✔' : '✖'} (৳{entry.prices.breakfast}) • L:{entry.meals.lunch ? '✔' : '✖'} (৳{entry.prices.lunch}) • D:{entry.meals.dinner ? '✔' : '✖'} (৳{entry.prices.dinner})
                        </span>
                        <span className="status-badge on">৳{entry.dayTotal}</span>
                      </div>
                    ))}
                    <div className="history-row total-row">
                      <span className="date">Running Total</span>
                      <span></span>
                      <span className="status-badge on">৳{mealHistory[0]?.runningTotal || 0}</span>
                    </div>
                  </>
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