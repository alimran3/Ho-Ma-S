import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './HallDetails.css';
import './CreateHallModal.css';
import { FaHotel } from "react-icons/fa6";

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
      const response = await axios.get(`/api/halls/${hallId}`, {
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
      const response = await axios.get(`/api/halls/${hallId}/floors`, {
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
      const response = await axios.get('/api/managers/available', {
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
        '/api/managers/create-with-details',
        {
          ...managerData,
          hallId,
          instituteId: localStorage.getItem('instituteId')
        },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      // Assign manager to hall
      await axios.put(
        `/api/halls/${hallId}/assign-manager`,
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
        `/api/halls/${hallId}/floors/create-with-details`,
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
          }}>Hall Management</h2>
          <p style={{
            margin: 0,
            color: '#456882',
            fontSize: '0.9rem'
          }}>Manage your hall operations</p>
        </div>

        <div style={{
          backgroundColor: '#456882',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '1.2rem',
            fontWeight: 600
          }}>{hall?.name || 'Hall Details'}</h3>
          <div style={{display: 'grid', gap: '8px'}}>
            <p style={{margin: 0, fontSize: '0.9rem'}}>
              <span style={{color: '#D2C1B6'}}>Location:</span> {hall?.location}
            </p>
            <p style={{margin: 0, fontSize: '0.9rem'}}>
              <span style={{color: '#D2C1B6'}}>Type:</span> {hall?.type} Hall
            </p>
            <p style={{margin: 0, fontSize: '0.9rem'}}>
              <span style={{color: '#D2C1B6'}}>Capacity:</span> {hall?.capacity} students
            </p>
            <p style={{margin: 0, fontSize: '0.9rem'}}>
              <span style={{color: '#D2C1B6'}}>Floors:</span> {hall?.totalFloors || 0}
            </p>
            <p style={{margin: 0, fontSize: '0.9rem'}}>
              <span style={{color: '#D2C1B6'}}>Rooms:</span> {hall?.totalRooms || 0}
            </p>
          </div>
        </div>

        <div style={{
          backgroundColor: '#456882',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h4 style={{
            margin: '0 0 12px 0',
            fontSize: '1.1rem',
            fontWeight: 600
          }}>Current Manager</h4>
          {hall?.manager ? (
            <div style={{display: 'grid', gap: '8px'}}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: '#F9F3EF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1B3C53',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                margin: '0 auto 12px'
              }}>
                {hall.manager.fullName?.charAt(0)?.toUpperCase() || 'M'}
              </div>
              <p style={{margin: 0, fontSize: '0.9rem', textAlign: 'center', fontWeight: 600}}>
                {hall.manager.fullName}
              </p>
              <p style={{margin: 0, fontSize: '0.8rem', textAlign: 'center', color: '#D2C1B6'}}>
                {hall.manager.email}
              </p>
            </div>
          ) : (
            <p style={{margin: 0, color: '#D2C1B6', fontSize: '0.9rem', textAlign: 'center'}}>
              No manager assigned
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{marginLeft: '320px', padding: '24px', width: '100%'}}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px',
          backgroundColor: '#1B3C53',
          color: '#F9F3EF',
          padding: '24px',
          borderRadius: '12px'
        }}>
          <div>
            <button
              onClick={() => navigate('/owner/dashboard')}
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
              ← Back to Dashboard
            </button>
            <h1 style={{
              margin: 0,
              fontSize: '2rem',
              fontWeight: 600,
              display: 'inline'
            }}>{hall.name}</h1>
            <span style={{
              backgroundColor: hall.isActive ? '#10B981' : '#EF4444',
              color: '#FFFFFF',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.9rem',
              marginLeft: '12px'
            }}>
              {hall.isActive ? '● Active' : '○ Inactive'}
            </span>
          </div>
        </div>

        {/* Action Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <div
            onClick={() => setShowAssignManager(true)}
            style={{
              backgroundColor: '#F9F3EF',
              border: '1px solid #456882',
              borderRadius: '12px',
              padding: '24px',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              textAlign: 'center'
            }}
          >
            <div style={{
              width: '60px',
              height: '60px',
              backgroundColor: '#1B3C53',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '1.5rem',
              color: '#F9F3EF'
            }}>👨‍💼</div>
            <h3 style={{
              margin: '0 0 8px 0',
              color: '#1B3C53',
              fontSize: '1.3rem',
              fontWeight: 600
            }}>Manager Assignment</h3>
            <p style={{
              margin: 0,
              color: '#456882',
              fontSize: '0.95rem'
            }}>{hall.manager ? 'Change current manager' : 'Assign a new manager'}</p>
          </div>

          <div
            onClick={() => setShowCreateFloor(true)}
            style={{
              backgroundColor: '#F9F3EF',
              border: '1px solid #456882',
              borderRadius: '12px',
              padding: '24px',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              textAlign: 'center'
            }}
          >
            <div style={{
              width: '60px',
              height: '60px',
              backgroundColor: '#1B3C53',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '1.5rem',
              color: '#F9F3EF'
            }}>🏢</div>
            <h3 style={{
              margin: '0 0 8px 0',
              color: '#1B3C53',
              fontSize: '1.3rem',
              fontWeight: 600
            }}>Add Floor</h3>
            <p style={{
              margin: 0,
              color: '#456882',
              fontSize: '0.95rem'
            }}>Create new floor with rooms</p>
          </div>
        </div>



        {/* Floor Management Section */}
        <div style={{
          backgroundColor: '#F9F3EF',
          border: '1px solid #456882',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
        }}>
          <h2 style={{
            margin: '0 0 24px 0',
            color: '#1B3C53',
            fontSize: '1.8rem',
            fontWeight: 600
          }}>Floor Management</h2>

          {floors.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#456882'
            }}>
              <p style={{
                margin: 0,
                fontSize: '1.1rem'
              }}>No floors created yet. Click "Add Floor" to create your first floor.</p>
            </div>
          ) : (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px'}}>
              {floors.map((floor) => (
                <div key={floor._id} style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D2C1B6',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <h3 style={{
                      margin: 0,
                      color: '#1B3C53',
                      fontSize: '1.3rem',
                      fontWeight: 600
                    }}>{floor.name}</h3>
                    <span style={{
                      backgroundColor: '#456882',
                      color: '#F9F3EF',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 500
                    }}>Floor {floor.floorNumber}</span>
                  </div>
                  <p style={{
                    margin: '0 0 16px 0',
                    color: '#456882',
                    fontSize: '0.95rem'
                  }}>{floor.description || 'No description'}</p>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    marginBottom: '16px'
                  }}>
                    {floor.facilities?.map((facility, idx) => (
                      <span key={idx} style={{
                        backgroundColor: '#D2C1B6',
                        color: '#1B3C53',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 500
                      }}>{facility}</span>
                    ))}
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                    fontSize: '0.9rem',
                    color: '#456882'
                  }}>
                    <span>Total Rooms: {floor.totalRooms}</span>
                    <span>Occupied: {floor.occupiedRooms || 0}</span>
                  </div>

                  <button
                    onClick={() => navigate(`/owner/floor/${floor._id}`)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#456882',
                      color: '#F9F3EF',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    View & Edit Rooms
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Manager Assignment Modal */}
      {showAssignManager && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowAssignManager(false)}>
          <div style={{
            backgroundColor: '#F9F3EF',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            border: '1px solid #456882'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                margin: 0,
                color: '#1B3C53',
                fontSize: '1.5rem',
                fontWeight: 600
              }}>Manager Assignment</h2>
              <button
                onClick={() => setShowAssignManager(false)}
                style={{
                  backgroundColor: '#456882',
                  color: '#F9F3EF',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >×</button>
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowCreateFloor(false)}>
          <div style={{
            backgroundColor: '#F9F3EF',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            border: '1px solid #456882'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                margin: 0,
                color: '#1B3C53',
                fontSize: '1.5rem',
                fontWeight: 600
              }}>Add New Floor</h2>
              <button
                onClick={() => setShowCreateFloor(false)}
                style={{
                  backgroundColor: '#456882',
                  color: '#F9F3EF',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >×</button>
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
