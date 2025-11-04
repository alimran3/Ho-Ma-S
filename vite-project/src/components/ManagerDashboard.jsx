import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ManagerDashboard.css';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [managerInfo, setManagerInfo] = useState(null);
  const [activeSection, setActiveSection] = useState('menu');
  const [students, setStudents] = useState([]);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [loading, setLoading] = useState(true);
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
      setMealPrices(res.data.mealPrices || {
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
      <div className="manager-dashboard" style={{width:'100%', maxWidth:'100%', overflowX:'hidden', margin:0, padding:'0 8px'}}>
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
      <div className="manager-main" style={{width:'100%', maxWidth:'100%', overflowX:'hidden', padding:'0 8px'}}>
        <div className="content-header">
          <h1>Hall Management Dashboard</h1>
          <p>Welcome back, {managerInfo?.fullName}</p>
        </div>

        {/* Section Buttons */}
        <div className="section-buttons" style={{display:'flex', flexWrap:'wrap', gap:8}}>
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
        </div>

        {/* Content Sections */}
        {activeSection === 'menu' && (
          <div className="menu-editor" style={{width:'100%', margin:0}}>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap: 12}}>
              {[{title:'Breakfast', key:'breakfast'},{title:'Lunch', key:'lunch'},{title:'Dinner', key:'dinner'}].map((sec)=> (
                <div key={sec.key} style={{background: (sec.key==='breakfast' ? '#FFF7ED' : (sec.key==='lunch' ? '#ECFEFF' : '#FDF2F8')), border:'1px solid #e5e7eb', borderRadius:12, boxShadow:'0 6px 14px rgba(0,0,0,0.06)', overflow:'hidden'}}>
                  <div style={{padding:'12px 14px', background:'linear-gradient(90deg,#f8fafc,#eef2ff)'}}>
                    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                      <h3 style={{margin:0, fontSize:18}}>{sec.title}</h3>
                      <span style={{fontSize:12, color:'#6b7280'}}>Edit items below</span>
                    </div>
                  </div>
                  {/* end header */}
                  <div style={{padding:'8px 12px', display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
                    <select
                      value={selectedPreset[sec.key] || ''}
                      onChange={(e)=>setSelectedPreset(prev=>({ ...prev, [sec.key]: e.target.value }))}
                      style={{padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:8}}
                    >
                      <option value="">Add preset...</option>
                      {(presets[sec.key]||[]).map(p => (
                        <option key={p.name} value={p.name}>{p.name} - ৳{p.price}</option>
                      ))}
                    </select>
                    <button type="button" className="register-student-btn" onClick={()=>addPreset(sec.key)}>Add</button>
                  </div>
                  <div style={{padding:12}}>
                    <MenuItemsEditor
                      items={dailyMeals[sec.key]}
                      onChange={(items) => {
                        const updated = { ...dailyMeals, [sec.key]: items };
                        setDailyMeals(updated);
                        const sum = (arr)=> (arr||[]).reduce((t,i)=> t + (Number(i.price)||0), 0);
                        setMealPrices(prev => ({ ...prev, [sec.key]: sum(items) }));
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div style={{display:'flex', gap:10, marginTop:12, flexWrap:'wrap', alignItems:'center', background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:10}}>
              <label>Breakfast Price <input type="number" value={mealPrices.breakfast} onChange={(e)=>setMealPrices({ ...mealPrices, breakfast: Number(e.target.value)||0 })} style={{marginLeft:8, width:120}} /></label>
              <label>Lunch Price <input type="number" value={mealPrices.lunch} onChange={(e)=>setMealPrices({ ...mealPrices, lunch: Number(e.target.value)||0 })} style={{marginLeft:8, width:120}} /></label>
              <label>Dinner Price <input type="number" value={mealPrices.dinner} onChange={(e)=>setMealPrices({ ...mealPrices, dinner: Number(e.target.value)||0 })} style={{marginLeft:8, width:120}} /></label>
              <div style={{fontWeight:700, marginLeft:16}}>Total: ৳{(Number(mealPrices.breakfast)||0) + (Number(mealPrices.lunch)||0) + (Number(mealPrices.dinner)||0)}</div>
              <div style={{marginLeft:'auto'}}>
                <button className="submit-btn" onClick={saveDailyMenu}>Save Today Menu</button>
              </div>
            </div>

            {/* Default menu section intentionally removed as requested */}
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
                    <span className={`status ${p.receivedByManager ? 'present' : 'absent'}`} style={{textTransform:'uppercase', fontWeight:700}}>
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
                    <span className={`status ${c.resolved ? 'present' : 'absent'}`} style={{textTransform:'uppercase', fontWeight:700}}>
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
  </>
  );
};

// Simple inline editor component for menu items
const MenuItemsEditor = ({ items, onChange }) => {
  const [local, setLocal] = useState(items || []);

  useEffect(() => { setLocal(items || []); }, [items]);

  const addItem = () => onChange([ ...local, { name: '', price: 0, image: '', description: '' } ]);
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

  return (
    <div>
      <div style={{display:'flex', flexDirection:'column', gap:12}}>
        {local.map((it, idx) => (
          <div key={idx} style={{display:'grid', gridTemplateColumns:'64px 1fr', gap:10, alignItems:'center', background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:10, padding:10, maxWidth:'100%'}}>
            <div style={{width:64, height:64, borderRadius:8, overflow:'hidden', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid #e5e7eb'}}>
              {it.image ? (
                <img src={it.image} alt={it.name||'item'} style={{width:'100%', height:'100%', objectFit:'cover'}} />
              ) : (
                <span style={{fontSize:12, color:'#9ca3af'}}>No Image</span>
              )}
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr', gap:8}}>
              <input type="text" placeholder="Item name" value={it.name||''} onChange={(e)=>updateItem(idx,'name',e.target.value)} style={{padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:8, minWidth:0, width:'100%'}} />
              <input type="number" placeholder="Price" value={it.price||0} onChange={(e)=>updateItem(idx,'price',e.target.value)} style={{padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:8, minWidth:0, width:'100%'}} />
              <input type="text" placeholder="Image URL (optional)" value={it.image||''} onChange={(e)=>updateItem(idx,'image',e.target.value)} style={{padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:8, minWidth:0, width:'100%', wordBreak:'break-all'}} />
            </div>
            <div style={{gridColumn:'1 / -1', display:'flex', justifyContent:'flex-end'}}>
              <button type="button" onClick={()=>removeItem(idx)} style={{background:'#fee2e2', color:'#b91c1c', border:'1px solid #fecaca', borderRadius:8, padding:'8px 12px', fontWeight:600}}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManagerDashboard;