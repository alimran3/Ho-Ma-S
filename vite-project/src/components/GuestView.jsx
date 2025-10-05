import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './GuestView.css';

const GuestView = () => {
  const navigate = useNavigate();
  const [halls, setHalls] = useState([]);
  const [selectedHall, setSelectedHall] = useState(null);
  const [floors, setFloors] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHalls();
  }, []);

  const fetchHalls = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/guest/halls');
      setHalls(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching halls:', error);
      setLoading(false);
    }
  };

  const fetchFloors = async (hallId) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/guest/halls/${hallId}/floors`);
      setFloors(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching floors:', error);
      setLoading(false);
    }
  };

  const fetchRooms = async (floorId) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/guest/floors/${floorId}/rooms`);
      setRooms(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setLoading(false);
    }
  };

  const handleHallSelect = (hall) => {
    setSelectedHall(hall);
    setSelectedFloor(null);
    setRooms([]);
    fetchFloors(hall._id);
  };

  const handleFloorSelect = (floor) => {
    setSelectedFloor(floor);
    fetchRooms(floor._id);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="guest-view">
      <div className="guest-header">
        <div className="header-content">
          <h1>Guest Portal - Hall Information</h1>
          <p>View available accommodation details</p>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="guest-content">
        {/* Halls Section */}
        <div className="section halls-section">
          <h2>Available Halls</h2>
          {loading && !selectedHall ? (
            <div className="loading">Loading halls...</div>
          ) : (
            <div className="halls-grid">
              {halls.map(hall => (
                <div 
                  key={hall._id} 
                  className={`hall-card ${selectedHall?._id === hall._id ? 'selected' : ''}`}
                  onClick={() => handleHallSelect(hall)}
                >
                  <h3>{hall.name}</h3>
                  <div className="hall-info">
                    <p><span>Type:</span> {hall.type} Hall</p>
                    <p><span>Location:</span> {hall.location}</p>
                    <p><span>Total Capacity:</span> {hall.capacity} students</p>
                    <p><span>Available Rooms:</span> {hall.availableRooms || 0}</p>
                  </div>
                  <div className="hall-facilities">
                    {hall.facilities?.slice(0, 3).map((facility, idx) => (
                      <span key={idx} className="facility-tag">{facility}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Floors Section */}
        {selectedHall && (
          <div className="section floors-section">
            <h2>Floors in {selectedHall.name}</h2>
            {loading && selectedHall && !selectedFloor ? (
              <div className="loading">Loading floors...</div>
            ) : (
              <div className="floors-grid">
                {floors.map(floor => (
                  <div 
                    key={floor._id} 
                    className={`floor-card ${selectedFloor?._id === floor._id ? 'selected' : ''}`}
                    onClick={() => handleFloorSelect(floor)}
                  >
                    <h3>{floor.name}</h3>
                    <p className="floor-number">Floor {floor.floorNumber}</p>
                    <div className="floor-stats">
                      <div className="stat">
                        <span className="stat-value">{floor.totalRooms}</span>
                        <span className="stat-label">Total Rooms</span>
                      </div>
                      <div className="stat">
                        <span className="stat-value">{floor.availableRooms || 0}</span>
                        <span className="stat-label">Available</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rooms Section */}
        {selectedFloor && (
          <div className="section rooms-section">
            <h2>Room Details - {selectedFloor.name}</h2>
            {loading && selectedFloor ? (
              <div className="loading">Loading rooms...</div>
            ) : (
              <div className="rooms-grid">
                {rooms.map(room => (
                  <div 
                    key={room._id} 
                    className={`room-card ${room.status}`}
                  >
                    <div className="room-header">
                      <h4>Room {room.roomNumber}</h4>
                      <span className={`vacancy-badge ${room.status}`}>
                        {room.status === 'available' ? 'Available' : 
                         room.status === 'occupied' ? 'Occupied' : 
                         'Maintenance'}
                      </span>
                    </div>
                    <div className="room-details">
                      <p><span>Type:</span> {room.type}</p>
                      <p><span>Capacity:</span> {room.capacity} beds</p>
                      <p><span>Vacancy:</span> {room.capacity - room.currentOccupancy} beds</p>
                      <p><span>Price:</span> ৳{room.pricePerBed}/bed/month</p>
                    </div>
                    {room.facilities && room.facilities.length > 0 && (
                      <div className="room-facilities">
                        {room.facilities.map((facility, idx) => (
                          <span key={idx} className="facility-badge">{facility}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestView;