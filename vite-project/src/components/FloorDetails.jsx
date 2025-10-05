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
      const response = await axios.get(`http://localhost:5000/api/floors/${floorId}`, {
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
      const response = await axios.get(`http://localhost:5000/api/floors/${floorId}/rooms`, {
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
        `http://localhost:5000/api/rooms/${roomId}`,
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
    <div className="floor-details-page">
      <div className="floor-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <span>←</span> Back to Hall
        </button>
        <div className="floor-title">
          <h1>{floor?.name}</h1>
          <span className="floor-badge">Floor {floor?.floorNumber}</span>
        </div>
      </div>

      <div className="floor-info-card">
        <h3>Floor Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">Description:</span>
            <span className="value">{floor?.description || 'No description'}</span>
          </div>
          <div className="info-item">
            <span className="label">Total Rooms:</span>
            <span className="value">{floor?.totalRooms}</span>
          </div>
          <div className="info-item">
            <span className="label">Facilities:</span>
            <div className="facilities-list">
              {floor?.facilities?.map((facility, idx) => (
                <span key={idx} className="facility-badge">{facility}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rooms-section">
        <h2>Room Management</h2>
        <div className="rooms-grid">
          {rooms.map(room => (
            <div key={room._id} className={`room-card ${room.status}`}>
              {editingRoom === room._id ? (
                <div className="edit-mode">
                  <h3>Room {room.roomNumber}</h3>
                  <div className="edit-form">
                    <div className="form-group">
                      <label>Capacity</label>
                      <input
                        type="number"
                        value={roomData.capacity}
                        onChange={(e) => setRoomData({...roomData, capacity: e.target.value})}
                        min="1"
                        max="10"
                      />
                    </div>
                    <div className="form-group">
                      <label>Room Type</label>
                      <select
                        value={roomData.type}
                        onChange={(e) => setRoomData({...roomData, type: e.target.value})}
                      >
                        {roomTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Price per Bed</label>
                      <input
                        type="number"
                        value={roomData.pricePerBed}
                        onChange={(e) => setRoomData({...roomData, pricePerBed: e.target.value})}
                        min="0"
                      />
                    </div>
                    <div className="edit-actions">
                      <button 
                        className="save-btn"
                        onClick={() => handleUpdateRoom(room._id)}
                      >
                        Save
                      </button>
                      <button 
                        className="cancel-btn"
                        onClick={() => setEditingRoom(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="room-header">
                    <h3>Room {room.roomNumber}</h3>
                    <span className={`status-indicator ${room.status}`}>
                      {room.status}
                    </span>
                  </div>
                  <div className="room-details">
                    <div className="detail-row">
                      <span>Type:</span>
                      <strong>{room.type}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Capacity:</span>
                      <strong>{room.capacity} beds</strong>
                    </div>
                    <div className="detail-row">
                      <span>Occupancy:</span>
                      <strong>{room.currentOccupancy}/{room.capacity}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Price:</span>
                      <strong>৳{room.pricePerBed}/bed</strong>
                    </div>
                  </div>
                  <div className="room-occupants">
                    <h4>Occupants ({room.occupants?.length || 0})</h4>
                    {room.occupants && room.occupants.length > 0 ? (
                      <ul>
                        {room.occupants.map((occupant, idx) => (
                          <li key={idx}>{occupant.fullName}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="no-occupants">No occupants</p>
                    )}
                  </div>
                  <button 
                    className="edit-btn"
                    onClick={() => handleEditRoom(room)}
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
  );
};

export default FloorDetails;