import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ManagerDashboard.css';

/* Import Agrandir Font */
import './fonts.css'; // We'll create this for Agrandir

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [managerInfo, setManagerInfo] = useState(null);
  const [activeSection, setActiveSection] = useState('menu');
  const [students, setStudents] = useState([]);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newRoomNumber, setNewRoomNumber] = useState('');
  // Complaints management state
  const [complaints, setComplaints] = useState([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [complaintsFilter, setComplaintsFilter] = useState('all'); // all | resolved | unresolved
  // Payments management state
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  // Menu management state
  const [dailyMeals, setDailyMeals] = useState({
    breakfast: [],
    lunch: [],
    dinner: []
  });
  const [defaultMeals, setDefaultMeals] = useState({
    breakfast: [],
    lunch: [],
    dinner: []
  });
  const [mealPrices, setMealPrices] = useState({ breakfast: 0, lunch: 0, dinner: 0 });
  const [menuInfo, setMenuInfo] = useState({ defaultApplied: false });
  const [stats, setStats] = useState({ today: { breakfast: 0, lunch: 0, dinner: 0 }, todayTurnedOn: [], todayTurnedOff: [], monthly: { breakfast: 0, lunch: 0, dinner: 0, revenue: 0 } });

  // Preset picker per meal for quick add
  const [selectedPreset, setSelectedPreset] = useState({ breakfast: '', lunch: '', dinner: '' });
  const presets = {
    breakfast: [
      { name: 'Paratha', price: 10 },
      { name: 'Egg Omelet', price: 15 },
      { name: 'Ruti', price: 8 },
      { name: 'Chhola', price: 15 },
      { name: 'Halua', price: 12 },
      { name: 'Milk Tea', price: 12 },
      { name: 'Black Tea', price: 8 },
      { name: 'Banana', price: 8 },
      { name: 'Bread Butter', price: 20 },
      { name: 'Suji', price: 18 }
    ],
    lunch: [
      { name: 'Rice', price: 20 },
      { name: 'Dal', price: 15 },
      { name: 'Chicken Curry', price: 60 },
      { name: 'Beef Curry', price: 90 },
      { name: 'Fish Curry', price: 55 },
      { name: 'Bhorta (Aloo)', price: 12 },
      { name: 'Bhorta (Begun)', price: 12 },
      { name: 'Vegetable Mix', price: 25 },
      { name: 'Egg Curry', price: 25 },
      { name: 'Salad', price: 10 }
    ],
    dinner: [
      { name: 'Khichuri', price: 40 },
      { name: 'Tehari', price: 70 },
      { name: 'Pulao', price: 60 },
      { name: 'Roti', price: 8 },
      { name: 'Chicken Roast', price: 80 },
      { name: 'Beef Bhuna', price: 95 },
      { name: 'Fish Fry', price: 50 },
      { name: 'Mixed Vegetable', price: 25 },
      { name: 'Dal', price: 15 },
      { name: 'Salad', price: 10 }
    ]
  };

  const fetchPayments = async () => {
    try {
      setPaymentsLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/manager/payments', { headers: { Authorization: `Bearer ${token}` } });
      setPayments(Array.isArray(res.data) ? res.data : (res.data?.payments || []));
    } catch (e) {
      console.error('Error fetching payments:', e);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const markPaymentReceived = async (paymentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/manager/payments/${paymentId}/receive`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setPayments(prev => prev.map(p => p._id === paymentId ? { ...p, receivedByManager: true, receivedAt: new Date().toISOString() } : p));
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to mark received');
    }
  };

  const pickRandom = (arr, n) => {
    const copy = [...arr];
    const out = [];
    while (copy.length && out.length < n) {
      const idx = Math.floor(Math.random() * copy.length);
      out.push(copy.splice(idx, 1)[0]);
    }
    return out;
  };

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
    fetchTodayMenu();
    fetchDefaultMenu();
    fetchMealStats();
    fetchComplaints();
    fetchPayments();
  }, []);

  const fetchManagerData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/manager/profile', {
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
      const response = await axios.get('/api/manager/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching students:', error);
      setLoading(false);
    }
  };

  const fetchTodayMenu = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/manager/menu', { headers: { Authorization: `Bearer ${token}` } });
      let meals = res.data.meals || { breakfast: [], lunch: [], dinner: [] };
      // Prefill 3 random items per meal if empty for the day
      const fillIfEmpty = (key) => (meals[key] && meals[key].length) ? meals[key] : pickRandom(presets[key]||[], 3);
      meals = {
        breakfast: fillIfEmpty('breakfast'),
        lunch: fillIfEmpty('lunch'),
        dinner: fillIfEmpty('dinner')
      };
      setDailyMeals(meals);
      setMenuInfo({ defaultApplied: !!res.data.defaultApplied });
      const sum = (arr)=> (arr||[]).reduce((t,i)=> t + (Number(i.price)||0), 0);
      setMealPrices({
        breakfast: sum(meals.breakfast),
        lunch: sum(meals.lunch),
        dinner: sum(meals.dinner)
      });
    } catch (e) {
      console.error('Error fetching manager menu:', e);
    }
  };

  const fetchDefaultMenu = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/manager/menu/default', { headers: { Authorization: `Bearer ${token}` } });
      setDefaultMeals(res.data.meals || { breakfast: [], lunch: [], dinner: [] });
    } catch (e) {
      console.error('Error fetching default menu:', e);
    }
  };

  const fetchMealStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/manager/dashboard/meal-stats', { headers: { Authorization: `Bearer ${token}` } });
      setStats(res.data);
    } catch (e) {
      console.error('Error fetching meal stats:', e);
    }
  };

  const fetchComplaints = async () => {
    try {
      setComplaintsLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/manager/complaints', { headers: { Authorization: `Bearer ${token}` } });
      setComplaints(Array.isArray(res.data) ? res.data : (res.data?.complaints || []));
    } catch (e) {
      console.error('Error fetching complaints:', e);
    } finally {
      setComplaintsLoading(false);
    }
  };

  const toggleComplaintResolved = async (complaintId, current) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/manager/complaints/${complaintId}`,
        { resolved: !current },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // update local state optimistically
      setComplaints(prev => prev.map(c => c._id === complaintId ? { ...c, resolved: !current, resolvedAt: !current ? new Date().toISOString() : null } : c));
    } catch (e) {
      console.error('Error updating complaint status:', e);
      alert(e.response?.data?.message || 'Failed to update complaint');
    }
  };

  const saveDailyMenu = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/manager/menu', { meals: dailyMeals, mealPrices }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Daily menu saved');
      setDailyMeals(response.data.meals || dailyMeals);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to save daily menu');
    }
  };

  const saveDefaultMenu = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/manager/menu/default', { meals: defaultMeals }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Default menu saved');
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to save default menu');
    }
  };

  const handleRegisterStudent = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/manager/register-student',
        studentData,
        { headers: { Authorization: `Bearer ${token}` } }
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
        `/api/manager/toggle-meal/${studentId}`,
        { mealStatus: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
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

  const addPreset = (mealKey) => {
    const name = selectedPreset[mealKey];
    if (!name) return;
    const presetItem = (presets[mealKey] || []).find(p => p.name === name);
    if (!presetItem) return;
    const updated = { ...(dailyMeals || {}) };
    updated[mealKey] = [ ...(updated[mealKey] || []), { ...presetItem, image: (presetItem.image||'') } ];
    setDailyMeals(updated);
    const sum = (arr)=> (arr||[]).reduce((t,i)=> t + (Number(i.price)||0), 0);
    setMealPrices(prev => ({ ...prev, [mealKey]: sum(updated[mealKey]) }));
  };

  return (
    <>
      <div className="manager-dashboard">
      {/* Left Sidebar */}
      <div className="manager-sidebar" style={{height: '100vh', position: 'fixed', left: 0, top: 0, overflowY: 'auto', width: '320px'}}>
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
      <div className="manager-main" style={{marginLeft: '320px'}}>
        <div className="content-header">
          <h1>Hall Management Dashboard</h1>
          <p>Welcome back, {managerInfo?.fullName}</p>
        </div>

        {/* Section Buttons */}
        <div className="section-buttons">
          <button
            className={`section-btn ${activeSection === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveSection('menu')}
          >
            🧾 Menu Editor
          </button>
          <button
            className={`section-btn ${activeSection === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveSection('stats')}
          >
            📊 Meal Stats
          </button>
          <button
            className={`section-btn ${activeSection === 'meal' ? 'active' : ''}`}
            onClick={() => setActiveSection('meal')}
          >
            🍽️ Meal Management
          </button>
          <button
            className={`section-btn ${activeSection === 'complaints' ? 'active' : ''}`}
            onClick={() => setActiveSection('complaints')}
          >
            🛠️ Complaints
          </button>
          <button
            className={`section-btn ${activeSection === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveSection('payments')}
          >
            💳 Payments
          </button>
          <button
            className={`section-btn ${activeSection === 'rooms' ? 'active' : ''}`}
            onClick={() => setActiveSection('rooms')}
          >
            🏠 Room Management
          </button>
        </div>

        {/* Content Sections */}
        {activeSection === 'menu' && (
          <div className="menu-editor" style={{width:'100%', maxWidth:'100%', overflow:'hidden'}}>
            <div style={{
              backgroundColor: '#1B3C53',
              padding: '32px 40px',
              borderRadius: '12px',
              marginBottom: '40px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '32px',
                fontWeight: 600,
                color: '#F9F3EF',
                position: 'relative',
                zIndex: 1,
                letterSpacing: '-0.02em'
              }}>Menu Editor</h2>
              <p style={{
                margin: '12px 0 0 0',
                color: '#456882',
                fontSize: '16px',
                fontWeight: 400,
                position: 'relative',
                zIndex: 1
              }}>Manage your daily meal offerings</p>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', width:'100%'}}>
              {[
                {title:'Breakfast', key:'breakfast', bg:'#D2C1B6', border:'#456882'},
                {title:'Lunch', key:'lunch', bg:'#D2C1B6', border:'#456882'},
                {title:'Dinner', key:'dinner', bg:'#D2C1B6', border:'#456882'}
              ].map((sec)=> (
                <div key={sec.key} style={{
                  backgroundColor: sec.bg,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                  position: 'relative',
                  border: `1px solid ${sec.border}`
                }}
                >
                  <div style={{
                    padding: '24px 28px',
                    backgroundColor: '#F9F3EF',
                    position: 'relative',
                    borderBottom: `1px solid ${sec.border}`
                  }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '20px',
                      fontWeight: 600,
                      color: '#1B3C53',
                      marginBottom: '12px',
                      letterSpacing: '-0.01em'
                    }}>{sec.title}</h3>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: sec.border,
                      color: '#F9F3EF',
                      padding: '10px 20px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: 600,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                      letterSpacing: '0.5px'
                    }}>
                      <span style={{fontSize: '12px'}}>৳</span>
                      <span>{mealPrices[sec.key] || 0}</span>
                    </div>
                  </div>

                  <div style={{padding: '24px 28px'}}>
                    <div style={{
                      marginBottom: '24px',
                      backgroundColor: '#F9F3EF',
                      border: '1px solid #456882',
                      borderRadius: '12px',
                      padding: '20px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
                    }}>
                      <label style={{
                        display: 'block',
                        marginBottom: '12px',
                        fontSize: '14px',
                        color: '#456882',
                        fontWeight: 500
                      }}>
                        Quick Add Preset Item
                      </label>
                      <div style={{display: 'flex', gap: '12px'}}>
                        <select
                          value={selectedPreset[sec.key] || ''}
                          onChange={(e)=>setSelectedPreset(prev=>({ ...prev, [sec.key]: e.target.value }))}
                          style={{
                            flex: 1,
                            padding: '12px 16px',
                            border: `1px solid #456882`,
                            borderRadius: '12px',
                            fontSize: '14px',
                            backgroundColor: '#F9F3EF',
                            color: '#1B3C53',
                            cursor: 'pointer',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                            fontWeight: 400
                          }}
                        >
                          <option value="">Select an item...</option>
                          {(presets[sec.key]||[]).map(p => (
                            <option key={p.name} value={p.name}>{p.name} - ৳{p.price}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={()=>addPreset(sec.key)}
                          style={{
                            padding: '12px 24px',
                            backgroundColor: sec.border,
                            color: '#F9F3EF',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 500,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                            letterSpacing: '0.5px'
                          }}
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    <div style={{marginTop: '24px'}}>
                      <label style={{
                        display: 'block',
                        marginBottom: '16px',
                        fontSize: '14px',
                        color: '#456882',
                        fontWeight: 500
                      }}>
                        Current Items ({(dailyMeals[sec.key]||[]).length})
                      </label>
                      <MenuItemsEditor
                        items={dailyMeals[sec.key]}
                        onChange={(items) => {
                          const updated = { ...dailyMeals, [sec.key]: items };
                          setDailyMeals(updated);
                          const sum = (arr)=> (arr||[]).reduce((t,i)=> t + (Number(i.price)||0), 0);
                          setMealPrices(prev => ({ ...prev, [sec.key]: sum(items) }));
                        }}
                        accentColor={sec.border}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: '32px',
              backgroundColor: '#F9F3EF',
              border: '1px solid #456882',
              borderRadius: '12px',
              padding: '32px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '24px',
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{display: 'flex', gap: '24px', flexWrap: 'wrap'}}>
                  <div style={{
                    textAlign: 'center',
                    padding: '20px 24px',
                    backgroundColor: '#D2C1B6',
                    borderRadius: '12px',
                    border: '1px solid #456882',
                    minWidth: '120px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
                  }}>
                    <div style={{fontSize: '12px', color: '#456882', marginBottom: '6px', fontWeight: 500}}>Breakfast</div>
                    <div style={{fontSize: '20px', fontWeight: 700, color: '#1B3C53'}}>৳{mealPrices.breakfast || 0}</div>
                  </div>
                  <div style={{
                    textAlign: 'center',
                    padding: '20px 24px',
                    backgroundColor: '#D2C1B6',
                    borderRadius: '12px',
                    border: '1px solid #456882',
                    minWidth: '120px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
                  }}>
                    <div style={{fontSize: '12px', color: '#456882', marginBottom: '6px', fontWeight: 500}}>Lunch</div>
                    <div style={{fontSize: '20px', fontWeight: 700, color: '#1B3C53'}}>৳{mealPrices.lunch || 0}</div>
                  </div>
                  <div style={{
                    textAlign: 'center',
                    padding: '20px 24px',
                    backgroundColor: '#D2C1B6',
                    borderRadius: '12px',
                    border: '1px solid #456882',
                    minWidth: '120px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
                  }}>
                    <div style={{fontSize: '12px', color: '#456882', marginBottom: '6px', fontWeight: 500}}>Dinner</div>
                    <div style={{fontSize: '20px', fontWeight: 700, color: '#1B3C53'}}>৳{mealPrices.dinner || 0}</div>
                  </div>
                  <div style={{
                    borderLeft: '1px solid #456882',
                    paddingLeft: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <div style={{fontSize: '12px', color: '#456882', marginBottom: '6px', fontWeight: 500}}>Daily Total</div>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: 800,
                      color: '#1B3C53',
                      letterSpacing: '-0.02em'
                    }}>৳{(Number(mealPrices.breakfast)||0) + (Number(mealPrices.lunch)||0) + (Number(mealPrices.dinner)||0)}</div>
                  </div>
                </div>
                <button
                  className="submit-btn"
                  onClick={saveDailyMenu}
                  style={{
                    padding: '16px 32px',
                    fontSize: '14px',
                    backgroundColor: '#1B3C53',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#F9F3EF',
                    cursor: 'pointer',
                    fontWeight: 600,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                    letterSpacing: '0.5px'
                  }}
                >
                  Save Today's Menu
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'payments' && (
          <div className="meal-management">
            <h2>Payments</h2>
            <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:10}}>
              <button className="submit-btn" onClick={fetchPayments} disabled={paymentsLoading}>{paymentsLoading ? 'Refreshing...' : 'Refresh'}</button>
            </div>
            <div className="students-grid">
              {(payments||[]).map(p => (
                <div key={p._id} className="student-meal-card" style={{display:'flex', flexDirection:'column', gap:8}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <h4 style={{margin:0}}>৳{p.amount} {p.currency}</h4>
                    <span className={`status ${p.receivedByManager ? 'present' : 'absent'}`} style={{
                      textTransform:'uppercase',
                      fontWeight:700,
                      backgroundColor: p.receivedByManager ? '#10B981' : '#F59E0B',
                      color: '#FFFFFF',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px'
                    }}>
                      {p.receivedByManager ? 'Received' : 'Pending' }
                    </span>
                  </div>
                  <div style={{fontSize:12, color:'#6b7280'}}>
                    <strong>TXN:</strong> {p.tran_id}
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6}}>
                    <div style={{fontSize:12, color:'#6b7280'}}>
                      <strong>Student:</strong> {p.student?.fullName} ({p.student?.studentId})
                    </div>
                    <div style={{fontSize:12, color:'#6b7280', textAlign:'right'}}>
                      <strong>Room:</strong> {p.student?.roomNumber}
                    </div>
                  </div>
                  <div style={{fontSize:12, color:'#6b7280'}}>
                    <strong>Date:</strong> {p.createdAt ? new Date(p.createdAt).toLocaleString() : 'N/A'}
                  </div>
                  {p.receivedAt && (
                    <div style={{fontSize:12, color:'#6b7280'}}>
                      <strong>Received At:</strong> {new Date(p.receivedAt).toLocaleString()}
                    </div>
                  )}
                  <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
                    <button className="edit-room-btn" disabled={p.receivedByManager} onClick={()=>markPaymentReceived(p._id)}>
                      Mark Received
                    </button>
                  </div>
                </div>
              ))}
              {(!payments || payments.length === 0) && !paymentsLoading && (
                <div style={{padding:12, color:'#6b7280'}}>No payments found.</div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'complaints' && (
          <div className="meal-management">
            <h2>Complaint Management</h2>
            <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:10}}>
              <label style={{fontWeight:600}}>Filter</label>
              <select value={complaintsFilter} onChange={(e)=>setComplaintsFilter(e.target.value)} style={{padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:8}}>
                <option value="all">All</option>
                <option value="unresolved">Unresolved</option>
                <option value="resolved">Resolved</option>
              </select>
              <button className="submit-btn" onClick={fetchComplaints} disabled={complaintsLoading}>{complaintsLoading ? 'Refreshing...' : 'Refresh'}</button>
            </div>
            <div className="students-grid">
              {(complaints||[])
                .filter(c => complaintsFilter === 'all' ? true : complaintsFilter === 'resolved' ? !!c.resolved : !c.resolved)
                .sort((a,b)=> new Date(b.createdAt||0) - new Date(a.createdAt||0))
                .map(c => (
                <div key={c._id} className="student-meal-card" style={{display:'flex', flexDirection:'column', gap:8}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <h4 style={{margin:0}}>{c.subject || 'No subject'}</h4>
                    <span className={`status ${c.resolved ? 'present' : 'absent'}`} style={{
                      textTransform:'uppercase',
                      fontWeight:700,
                      backgroundColor: c.resolved ? '#10B981' : '#EF4444',
                      color: '#FFFFFF',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px'
                    }}>
                      {c.resolved ? 'Resolved' : 'Unresolved'}
                    </span>
                  </div>
                  <p style={{margin:0, color:'#6b7280'}}>
                    <strong>Category:</strong> {c.category || 'general'}
                  </p>
                  <p style={{margin:0}}>{c.description}</p>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6}}>
                    <div style={{fontSize:12, color:'#6b7280'}}>
                      <strong>By:</strong> {c.student?.fullName || c.studentName || 'Unknown'}
                    </div>
                    <div style={{fontSize:12, color:'#6b7280', textAlign:'right'}}>
                      <strong>Created:</strong> {c.createdAt ? new Date(c.createdAt).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                  {c.resolvedAt && (
                    <div style={{fontSize:12, color:'#6b7280'}}>
                      <strong>Resolved:</strong> {new Date(c.resolvedAt).toLocaleString()}
                    </div>
                  )}
                  <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
                    <button className="edit-room-btn" onClick={()=>toggleComplaintResolved(c._id, c.resolved)}>
                      {c.resolved ? 'Mark Unresolved' : 'Mark Resolved'}
                    </button>
                  </div>
                </div>
              ))}
              {(!complaints || complaints.length === 0) && !complaintsLoading && (
                <div style={{padding:12, color:'#6b7280'}}>No complaints found.</div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'stats' && (
          <div className="meal-management">
            <h2>Meal Statistics</h2>
            <div className="meal-summary">
              <h3>Today's Counts</h3>
              <p>Breakfast: {stats.today?.breakfast || 0}</p>
              <p>Lunch: {stats.today?.lunch || 0}</p>
              <p>Dinner: {stats.today?.dinner || 0}</p>
              <h4>Monthly Totals</h4>
              <p>Breakfast: {stats.monthly?.breakfast || 0}</p>
              <p>Lunch: {stats.monthly?.lunch || 0}</p>
              <p>Dinner: {stats.monthly?.dinner || 0}</p>
              <p><strong>Revenue:</strong> ৳{stats.monthly?.revenue || 0}</p>
            </div>
          </div>
        )}

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

        {activeSection === 'rooms' && (
          <div className="room-management">
            <h2>Room Management</h2>
            <div className="students-grid">
              {students.map(student => (
                <div key={student._id} className="student-meal-card">
                  <h4>{student.fullName}</h4>
                  <p>Room: {student.roomNumber}</p>
                  <p>Floor: {student.floorNumber}</p>
                  <p>ID: {student.studentId}</p>
                  <p>Department: {student.department}</p>
                  <div style={{display:'flex', gap:8, marginTop:10}}>
                    <button 
                      className="edit-room-btn"
                      onClick={() => {
                        setSelectedStudent(student);
                        setNewRoomNumber('');
                        setShowShiftModal(true);
                      }}
                    >
                      Shift Room
                    </button>
                    <button 
                      className="edit-room-btn"
                      style={{background:'#fee2e2', color:'#b91c1c'}}
                      onClick={async () => {
                        if (window.confirm(`Remove ${student.fullName} from room ${student.roomNumber}?`)) {
                          try {
                            const token = localStorage.getItem('token');
                            await axios.put(
                              `/api/manager/students/${student._id}/remove-room`,
                              {},
                              { headers: { Authorization: `Bearer ${token}` } }
                            );
                            alert('Student removed from room');
                            fetchStudents();
                          } catch (error) {
                            alert(error.response?.data?.message || 'Failed to remove student');
                          }
                        }
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Shift Room Modal */}
    {showShiftModal && (
      <div className="modal-overlay" onClick={() => setShowShiftModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Shift Student to New Room</h2>
            <button className="close-btn" onClick={() => setShowShiftModal(false)}>×</button>
          </div>
          <div style={{padding:20}}>
            <p><strong>Student:</strong> {selectedStudent?.fullName}</p>
            <p><strong>Current Room:</strong> {selectedStudent?.roomNumber}</p>
            <div className="form-group" style={{marginTop:20}}>
              <label>New Room Number *</label>
              <input
                type="text"
                value={newRoomNumber}
                onChange={(e) => setNewRoomNumber(e.target.value)}
                placeholder="Enter new room number"
                required
              />
            </div>
          </div>
          <div className="modal-actions">
            <button className="cancel-btn" onClick={() => setShowShiftModal(false)}>
              Cancel
            </button>
            <button 
              className="submit-btn"
              onClick={async () => {
                if (!newRoomNumber) {
                  alert('Please enter a room number');
                  return;
                }
                try {
                  const token = localStorage.getItem('token');
                  await axios.put(
                    `/api/manager/students/${selectedStudent._id}/shift-room`,
                    { newRoomNumber },
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                  alert('Student shifted successfully');
                  setShowShiftModal(false);
                  fetchStudents();
                } catch (error) {
                  alert(error.response?.data?.message || 'Failed to shift student');
                }
              }}
            >
              Shift Room
            </button>
          </div>
        </div>
      </div>
    )}

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
  </>
  );
};

// Simple inline editor component for menu items
const MenuItemsEditor = ({ items, onChange, accentColor }) => {
  const [local, setLocal] = useState(items || []);

  useEffect(() => { setLocal(items || []); }, [items]);

  const updateItem = (idx, key, value) => {
    const arr = local.slice();
    arr[idx] = { ...arr[idx], [key]: key === 'price' ? Number(value)||0 : value };
    setLocal(arr);
    onChange(arr);
  };
  const removeItem = (idx) => {
    const arr = local.filter((_, i) => i !== idx);
    setLocal(arr);
    onChange(arr);
  };

  if (!local || local.length === 0) {
    return (
      <div style={{
        padding: '40px 32px',
        textAlign: 'center',
        color: '#456882',
        fontSize: '16px',
        backgroundColor: '#F9F3EF',
        borderRadius: '12px',
        border: `1px solid #456882`,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '16px',
          opacity: 0.5
        }}>📋</div>
        <div style={{
          fontWeight: 600,
          color: '#1B3C53',
          position: 'relative',
          zIndex: 1,
          fontSize: '18px'
        }}>No items added yet</div>
        <div style={{
          fontSize: '14px',
          color: '#456882',
          marginTop: '8px',
          position: 'relative',
          zIndex: 1
        }}>Use the dropdown above to add items</div>
      </div>
    );
  }

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
      {local.map((it, idx) => (
        <div key={idx} style={{
          backgroundColor: '#F9F3EF',
          border: `1px solid #456882`,
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          position: 'relative',
          overflow: 'hidden'
        }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            marginBottom: '20px',
            position: 'relative',
            zIndex: 1
          }}>
            <button
              type="button"
              onClick={()=>removeItem(idx)}
              style={{
                backgroundColor: '#456882',
                color: '#F9F3EF',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 20px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: 600,
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                letterSpacing: '0.5px'
              }}
            >
              Remove
            </button>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '16px',
            alignItems: 'end',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
              <label style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#456882',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>Name</label>
              <input
                type="text"
                placeholder="Enter item name"
                value={it.name||''}
                onChange={(e)=>updateItem(idx,'name',e.target.value)}
                style={{
                  padding: '14px 16px',
                  border: `1px solid #456882`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: '#FFFFFF',
                  color: '#1B3C53',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  fontWeight: 400,
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
              <label style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#456882',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>Price</label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                border: `1px solid #456882`,
                borderRadius: '8px',
                padding: '14px 16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                <span style={{
                  color: '#456882',
                  fontWeight: 700,
                  fontSize: '14px',
                  marginRight: '8px'
                }}>৳</span>
                <input
                  type="number"
                  placeholder="0"
                  value={it.price||0}
                  onChange={(e)=>updateItem(idx,'price',e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    color: '#1B3C53',
                    fontSize: '14px',
                    fontWeight: 400,
                    width: '100%',
                    textAlign: 'left'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ManagerDashboard;
