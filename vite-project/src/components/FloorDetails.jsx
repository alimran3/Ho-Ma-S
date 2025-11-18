import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './FloorDetails.css';

const FloorDetails = () => {
  const { floorId } = useParams();
  const navigate = useNavigate();
  const [floor, setFloor] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomData, setRoomData] = useState({
    capacity: '',
    type: '',
    pricePerBed: ''
  });

  const roomTypes = ['single', 'double', 'triple', 'dormitory'];

  useEffect(() => {
    fetchFloorDetails();
    fetchRooms();
  }, [floorId]);

  const fetchFloorDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/floors/${floorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFloor(response.data);
    } catch (error) {
      console.error('Error fetching floor details:', error);
    }
  };

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/floors/${floorId}/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRooms(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setLoading(false);
    }
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room._id);
    setRoomData({
      capacity: room.capacity,
      type: room.type,
      pricePerBed: room.pricePerBed
    });
  };

  const handleUpdateRoom = async (roomId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/rooms/${roomId}`,
        roomData,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setEditingRoom(null);
      fetchRooms();
      alert('Room updated successfully!');
    } catch (error) {
      console.error('Error updating room:', error);
      alert('Failed to update room');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading floor details...</p>
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
          }}>Floor Management</h2>
          <p style={{
            margin: 0,
            color: '#456882',
            fontSize: '0.9rem'
          }}>Manage your floor operations</p>
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
          }}>{floor?.name || 'Floor Details'}</h3>
          <div style={{display: 'grid', gap: '8px'}}>
            <p style={{margin: 0, fontSize: '0.9rem'}}>
              <span style={{color: '#D2C1B6'}}>Floor:</span> {floor?.floorNumber}
            </p>
            <p style={{margin: 0, fontSize: '0.9rem'}}>
              <span style={{color: '#D2C1B6'}}>Rooms:</span> {floor?.totalRooms}
            </p>
            <p style={{margin: 0, fontSize: '0.9rem'}}>
              <span style={{color: '#D2C1B6'}}>Description:</span> {floor?.description || 'No description'}
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
          }}>Facilities</h4>
          <div style={{display: 'grid', gap: '6px'}}>
            {floor?.facilities?.map((facility, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.9rem'
              }}>
                <span style={{color: '#D2C1B6', marginRight: '8px'}}>✓</span>
                {facility}
              </div>
            )) || <p style={{margin: 0, color: '#D2C1B6'}}>No facilities listed</p>}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{marginLeft: '320px', padding: '24px', width: '100%'}}>
        <div className="floor-header" style={{
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
              className="back-button"
              onClick={() => navigate(-1)}
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
              ← Back to Hall
            </button>
            <h1 style={{
              margin: 0,
              fontSize: '2rem',
              fontWeight: 600,
              display: 'inline'
            }}>{floor?.name}</h1>
            <span style={{
              backgroundColor: '#456882',
              color: '#F9F3EF',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.9rem',
              marginLeft: '12px'
            }}>Floor {floor?.floorNumber}</span>
          </div>
        </div>

        <div style={{
          backgroundColor: '#F9F3EF',
          border: '1px solid #456882',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            color: '#1B3C53',
            fontSize: '1.5rem',
            fontWeight: 600
          }}>Floor Information</h3>
          <div style={{display: 'grid', gap: '16px'}}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid #D2C1B6'
            }}>
              <span style={{fontWeight: 600, color: '#456882'}}>Description:</span>
              <span style={{color: '#1B3C53'}}>{floor?.description || 'No description'}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid #D2C1B6'
            }}>
              <span style={{fontWeight: 600, color: '#456882'}}>Total Rooms:</span>
              <span style={{color: '#1B3C53'}}>{floor?.totalRooms}</span>
            </div>
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid #D2C1B6'
            }}>
              <span style={{fontWeight: 600, color: '#456882', display: 'block', marginBottom: '8px'}}>Facilities:</span>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                {floor?.facilities?.map((facility, idx) => (
                  <span key={idx} style={{
                    backgroundColor: '#456882',
                    color: '#F9F3EF',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 500
                  }}>{facility}</span>
                )) || <span style={{color: '#456882'}}>No facilities listed</span>}
              </div>
            </div>
          </div>
        </div>

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
          }}>Room Management</h2>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px'}}>
            {rooms.map(room => (
              <div key={room._id} style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #D2C1B6',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                position: 'relative'
              }}>
                {editingRoom === room._id ? (
                  <div>
                    <h3 style={{
                      margin: '0 0 16px 0',
                      color: '#1B3C53',
                      fontSize: '1.3rem',
                      fontWeight: 600
                    }}>Room {room.roomNumber}</h3>
                    <div style={{display: 'grid', gap: '16px'}}>
                      <div>
                        <label style={{
                          display: 'block',
                          marginBottom: '6px',
                          color: '#456882',
                          fontWeight: 600,
                          fontSize: '0.9rem'
                        }}>Capacity</label>
                        <input
                          type="number"
                          value={roomData.capacity}
                          onChange={(e) => setRoomData({...roomData, capacity: e.target.value})}
                          min="1"
                          max="10"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #456882',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            backgroundColor: '#F9F3EF',
                            color: '#1B3C53'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          marginBottom: '6px',
                          color: '#456882',
                          fontWeight: 600,
                          fontSize: '0.9rem'
                        }}>Room Type</label>
                        <select
                          value={roomData.type}
                          onChange={(e) => setRoomData({...roomData, type: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #456882',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            backgroundColor: '#F9F3EF',
                            color: '#1B3C53'
                          }}
                        >
                          {roomTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          marginBottom: '6px',
                          color: '#456882',
                          fontWeight: 600,
                          fontSize: '0.9rem'
                        }}>Price per Bed</label>
                        <input
                          type="number"
                          value={roomData.pricePerBed}
                          onChange={(e) => setRoomData({...roomData, pricePerBed: e.target.value})}
                          min="0"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #456882',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            backgroundColor: '#F9F3EF',
                            color: '#1B3C53'
                          }}
                        />
                      </div>
                      <div style={{display: 'flex', gap: '12px', marginTop: '16px'}}>
                        <button
                          onClick={() => handleUpdateRoom(room._id)}
                          style={{
                            flex: 1,
                            padding: '12px',
                            backgroundColor: '#1B3C53',
                            color: '#F9F3EF',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingRoom(null)}
                          style={{
                            flex: 1,
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
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px'
                    }}>
                      <h3 style={{
                        margin: 0,
                        color: '#1B3C53',
                        fontSize: '1.3rem',
                        fontWeight: 600
                      }}>Room {room.roomNumber}</h3>
                      <span style={{
                        backgroundColor: room.status === 'available' ? '#10B981' : room.status === 'occupied' ? '#F59E0B' : '#EF4444',
                        color: '#FFFFFF',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}>
                        {room.status}
                      </span>
                    </div>
                    <div style={{display: 'grid', gap: '12px', marginBottom: '16px'}}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: '#F9F3EF',
                        borderRadius: '6px'
                      }}>
                        <span style={{fontWeight: 600, color: '#456882', fontSize: '0.9rem'}}>Type:</span>
                        <span style={{color: '#1B3C53', fontSize: '0.9rem'}}>{room.type}</span>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: '#F9F3EF',
                        borderRadius: '6px'
                      }}>
                        <span style={{fontWeight: 600, color: '#456882', fontSize: '0.9rem'}}>Capacity:</span>
                        <span style={{color: '#1B3C53', fontSize: '0.9rem'}}>{room.capacity} beds</span>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: '#F9F3EF',
                        borderRadius: '6px'
                      }}>
                        <span style={{fontWeight: 600, color: '#456882', fontSize: '0.9rem'}}>Occupancy:</span>
                        <span style={{color: '#1B3C53', fontSize: '0.9rem'}}>{room.currentOccupancy}/{room.capacity}</span>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: '#F9F3EF',
                        borderRadius: '6px'
                      }}>
                        <span style={{fontWeight: 600, color: '#456882', fontSize: '0.9rem'}}>Price:</span>
                        <span style={{color: '#1B3C53', fontSize: '0.9rem', fontWeight: 600}}>৳{room.pricePerBed}/bed</span>
                      </div>
                    </div>
                    <div style={{marginBottom: '16px'}}>
                      <h4 style={{
                        margin: '0 0 8px 0',
                        color: '#456882',
                        fontSize: '1rem',
                        fontWeight: 600
                      }}>Occupants ({room.occupants?.length || 0})</h4>
                      {room.occupants && room.occupants.length > 0 ? (
                        <div style={{display: 'grid', gap: '4px'}}>
                          {room.occupants.map((occupant, idx) => (
                            <div key={idx} style={{
                              padding: '6px 12px',
                              backgroundColor: '#D2C1B6',
                              borderRadius: '6px',
                              fontSize: '0.9rem',
                              color: '#1B3C53'
                            }}>{occupant.fullName}</div>
                          ))}
                        </div>
                      ) : (
                        <p style={{
                          margin: 0,
                          color: '#456882',
                          fontSize: '0.9rem',
                          fontStyle: 'italic'
                        }}>No occupants</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleEditRoom(room)}
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
                      Edit Room
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloorDetails;