import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './HallDetails.css';

const HallDetails = () => {
  const { hallId } = useParams();
  const navigate = useNavigate();
  const [hall, setHall] = useState(null);
  const [floors, setFloors] = useState([]);
  const [managers, setManagers] = useState([]);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [showCreateFloor, setShowCreateFloor] = useState(false);
  const [showAssignManager, setShowAssignManager] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Manager form state
  const [managerData, setManagerData] = useState({
    fullName: '',
    age: '',
    bloodGroup: '',
    rank: '',
    salary: '',
    phone: '',
    email: '',
    address: '',
    username: '',
    password: '',
    nid: '',
    joinDate: new Date().toISOString().split('T')[0]
  });

  // Floor form state
  const [floorData, setFloorData] = useState({
    floorNumber: '',
    name: '',
    description: '',
    facilities: [],
    totalRooms: ''
  });

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  const managerRanks = ['Junior Manager', 'Senior Manager', 'Head Manager', 'Assistant Manager'];
  const floorFacilities = ['Water Cooler', 'Common Bathroom', 'Study Room', 'WiFi', 'Security Camera', 'Emergency Exit'];

  useEffect(() => {
    fetchHallDetails();
    fetchFloors();
    fetchManagers();
  }, [hallId]);

  const fetchHallDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/halls/${hallId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHall(response.data);
      setSelectedManagerId(response.data.manager?._id || '');
    } catch (error) {
      console.error('Error fetching hall details:', error);
    }
  };

  const fetchFloors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/halls/${hallId}/floors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFloors(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching floors:', error);
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/managers/available', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setManagers(response.data);
    } catch (error) {
      console.error('Error fetching managers:', error);
    }
  };

  const handleAssignManager = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      // Create manager account
      const managerResponse = await axios.post(
        'http://localhost:5000/api/managers/create-with-details',
        {
          ...managerData,
          hallId,
          instituteId: localStorage.getItem('instituteId')
        },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      // Assign manager to hall
      await axios.put(
        `http://localhost:5000/api/halls/${hallId}/assign-manager`,
        { managerId: managerResponse.data.manager.id },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      alert('Manager assigned successfully!');
      setShowAssignManager(false);
      fetchHallDetails();
      resetManagerForm();
    } catch (error) {
      console.error('Error assigning manager:', error);
      alert('Failed to assign manager: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const handleCreateFloor = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      await axios.post(
        `http://localhost:5000/api/halls/${hallId}/floors/create-with-details`,
        floorData,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      alert('Floor created successfully with rooms!');
      setShowCreateFloor(false);
      setFloorData({
        floorNumber: '',
        name: '',
        description: '',
        facilities: [],
        totalRooms: ''
      });
      fetchFloors();
      fetchHallDetails();
    } catch (error) {
      console.error('Error creating floor:', error);
      alert('Failed to create floor: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const resetManagerForm = () => {
    setManagerData({
      fullName: '',
      age: '',
      bloodGroup: '',
      rank: '',
      salary: '',
      phone: '',
      email: '',
      address: '',
      username: '',
      password: '',
      nid: '',
      joinDate: new Date().toISOString().split('T')[0]
    });
  };

  const handleFacilityToggle = (facility) => {
    const updatedFacilities = floorData.facilities.includes(facility)
      ? floorData.facilities.filter(f => f !== facility)
      : [...floorData.facilities, facility];
    setFloorData({ ...floorData, facilities: updatedFacilities });
  };

  if (!hall || loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading hall details...</p>
      </div>
    );
  }

  return (
    <div className="hall-details-page">
      <div className="hall-details-content">
        {/* Header */}
        <div className="details-header">
          <button className="back-button" onClick={() => navigate('/owner/dashboard')}>
            <span>←</span> Back to Dashboard
          </button>
          <div className="header-info">
            <h1>{hall.name}</h1>
            <span className={`status-badge ${hall.isActive ? 'active' : 'inactive'}`}>
              {hall.isActive ? '● Active' : '○ Inactive'}
            </span>
          </div>
        </div>

        {/* Hall Info Section */}
        <div className="hall-info-section">
          <div className="info-card">
            <h3>Hall Information</h3>
            <div className="info-grid">
              <div className="info-row">
                <span>Location:</span>
                <strong>{hall.location}</strong>
              </div>
              <div className="info-row">
                <span>Type:</span>
                <strong>{hall.type} Hall</strong>
              </div>
              <div className="info-row">
                <span>Capacity:</span>
                <strong>{hall.capacity} students</strong>
              </div>
              <div className="info-row">
                <span>Total Floors:</span>
                <strong>{hall.totalFloors || 0}</strong>
              </div>
              <div className="info-row">
                <span>Total Rooms:</span>
                <strong>{hall.totalRooms || 0}</strong>
              </div>
              <div className="info-row">
                <span>Occupied:</span>
                <strong>{hall.occupiedRooms || 0} rooms</strong>
              </div>
            </div>
          </div>

          {/* Current Manager Info */}
          {hall.manager && (
            <div className="info-card">
              <h3>Current Manager</h3>
              <div className="manager-display">
                <div className="manager-avatar">
                  {hall.manager.fullName.charAt(0)}
                </div>
                <div className="manager-details">
                  <h4>{hall.manager.fullName}</h4>
                  <p>📧 {hall.manager.email}</p>
                  <p>📱 {hall.manager.phone || 'No phone'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Cards */}
        <div className="action-cards">
          <div className="action-card manager-card" onClick={() => setShowAssignManager(true)}>
            <div className="action-icon">👨‍💼</div>
            <h3>Manager Assignment</h3>
            <p>{hall.manager ? 'Change current manager' : 'Assign a new manager'}</p>
          </div>

          <div className="action-card floor-card" onClick={() => setShowCreateFloor(true)}>
            <div className="action-icon">🏢</div>
            <h3>Add Floor</h3>
            <p>Create new floor with rooms</p>
          </div>
        </div>

        {/* Floor Management Section - FULL WIDTH ROW LAYOUT */}
        <div className="floors-section">
          <h2>Floor Management</h2>
          
          {floors.length === 0 ? (
            <div className="empty-state">
              <p>No floors created yet. Click "Add Floor" to create your first floor.</p>
            </div>
          ) : (
            <div className="floors-container">
              <div className="floors-wrapper">
                {floors.map((floor) => (
                  <div key={floor._id} className="floor-card">
                    <div className="floor-header">
                      <h3>{floor.name}</h3>
                      <span className="floor-badge">Floor {floor.floorNumber}</span>
                    </div>
                    <p className="floor-description">{floor.description || 'No description'}</p>
                    <div className="floor-facilities">
                      {floor.facilities?.map((facility, idx) => (
                        <span key={idx} className="facility-tag">{facility}</span>
                      ))}
                    </div>
                    <div className="floor-stats">
                      <span>Total Rooms: {floor.totalRooms}</span>
                      <span>•</span>
                      <span>Occupied: {floor.occupiedRooms || 0}</span>
                    </div>
                    
                    <button 
                      className="view-rooms-btn"
                      onClick={() => navigate(`/owner/floor/${floor._id}`)}
                    >
                      View & Edit Rooms
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manager Assignment Modal */}
      {showAssignManager && (
        <div className="modal-overlay" onClick={() => setShowAssignManager(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Manager Assignment</h2>
              <button className="close-btn" onClick={() => setShowAssignManager(false)}>×</button>
            </div>
            <form onSubmit={handleAssignManager} className="manager-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={managerData.fullName}
                    onChange={(e) => setManagerData({...managerData, fullName: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Age *</label>
                  <input
                    type="number"
                    value={managerData.age}
                    onChange={(e) => setManagerData({...managerData, age: e.target.value})}
                    min="18"
                    max="65"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Blood Group *</label>
                  <select
                    value={managerData.bloodGroup}
                    onChange={(e) => setManagerData({...managerData, bloodGroup: e.target.value})}
                    required
                  >
                    <option value="">Select Blood Group</option>
                    {bloodGroups.map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Rank *</label>
                  <select
                    value={managerData.rank}
                    onChange={(e) => setManagerData({...managerData, rank: e.target.value})}
                    required
                  >
                    <option value="">Select Rank</option>
                    {managerRanks.map(rank => (
                      <option key={rank} value={rank}>{rank}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Monthly Salary *</label>
                  <input
                    type="number"
                    value={managerData.salary}
                    onChange={(e) => setManagerData({...managerData, salary: e.target.value})}
                    placeholder="Amount in BDT"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    value={managerData.phone}
                    onChange={(e) => setManagerData({...managerData, phone: e.target.value})}
                    placeholder="+880 1XXX-XXXXXX"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={managerData.email}
                    onChange={(e) => setManagerData({...managerData, email: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>NID Number *</label>
                  <input
                    type="text"
                    value={managerData.nid}
                    onChange={(e) => setManagerData({...managerData, nid: e.target.value})}
                    placeholder="National ID Number"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Join Date *</label>
                  <input
                    type="date"
                    value={managerData.joinDate}
                    onChange={(e) => setManagerData({...managerData, joinDate: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label>Address *</label>
                  <textarea
                    value={managerData.address}
                    onChange={(e) => setManagerData({...managerData, address: e.target.value})}
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
                    value={managerData.username}
                    onChange={(e) => setManagerData({...managerData, username: e.target.value})}
                    placeholder="Create username"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    value={managerData.password}
                    onChange={(e) => setManagerData({...managerData, password: e.target.value})}
                    placeholder="Create password"
                    minLength="6"
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowAssignManager(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Assign Manager
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Floor Modal */}
      {showCreateFloor && (
        <div className="modal-overlay" onClick={() => setShowCreateFloor(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Floor</h2>
              <button className="close-btn" onClick={() => setShowCreateFloor(false)}>×</button>
            </div>
            <form onSubmit={handleCreateFloor} className="floor-form">
              <div className="form-group">
                <label>Floor Number *</label>
                <input
                  type="number"
                  value={floorData.floorNumber}
                  onChange={(e) => setFloorData({...floorData, floorNumber: e.target.value})}
                  required
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Floor Name *</label>
                <input
                  type="text"
                  value={floorData.name}
                  onChange={(e) => setFloorData({...floorData, name: e.target.value})}
                  placeholder="e.g., Ground Floor, First Floor"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={floorData.description}
                  onChange={(e) => setFloorData({...floorData, description: e.target.value})}
                  rows="3"
                  placeholder="Floor description..."
                />
              </div>

              <div className="form-group">
                <label>Facilities</label>
                <div className="facilities-grid">
                  {floorFacilities.map(facility => (
                    <label key={facility} className="facility-checkbox">
                      <input
                        type="checkbox"
                        checked={floorData.facilities.includes(facility)}
                        onChange={() => handleFacilityToggle(facility)}
                      />
                      <span>{facility}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Total Rooms *</label>
                <input
                  type="number"
                  value={floorData.totalRooms}
                  onChange={(e) => setFloorData({...floorData, totalRooms: e.target.value})}
                  placeholder="Number of rooms on this floor"
                  required
                  min="1"
                />
                <p className="help-text">Room cards will be automatically created based on this number</p>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowCreateFloor(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Create Floor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HallDetails;