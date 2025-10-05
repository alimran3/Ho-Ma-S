// FloorCard.js
import React from 'react';
import './FloorCard.css';

const FloorCard = ({ floor, floorNumber, onClick }) => {
  const getTotalCapacity = () => {
    const { single = 0, double = 0, triple = 0, dormitory = 0 } = floor.roomsPerType;
    return (single * 1) + (double * 2) + (triple * 3) + (dormitory * 4);
  };

  const getOccupancyRate = () => {
    if (!floor.totalRooms || floor.totalRooms === 0) return 0;
    return Math.round((floor.occupiedRooms / floor.totalRooms) * 100);
  };

  const getRoomTypeDisplay = () => {
    const types = [];
    const { single, double, triple, dormitory } = floor.roomsPerType;
    
    if (single > 0) types.push(`${single} Single`);
    if (double > 0) types.push(`${double} Double`);
    if (triple > 0) types.push(`${triple} Triple`);
    if (dormitory > 0) types.push(`${dormitory} Dorm`);
    
    return types.join(', ');
  };

  return (
    <div className="floor-card" onClick={onClick}>
      <div className="floor-header">
        <div className="floor-number-badge">
          <span>F{floorNumber}</span>
        </div>
        <h3>{floor.name}</h3>
      </div>

      <div className="floor-stats">
        <div className="stat-row">
          <span className="stat-label">Total Rooms</span>
          <span className="stat-value">{floor.totalRooms}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Capacity</span>
          <span className="stat-value">{getTotalCapacity()} students</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Occupied</span>
          <span className="stat-value">{floor.occupiedRooms} rooms</span>
        </div>
      </div>

      <div className="room-types">
        <p className="room-types-label">Room Types:</p>
        <p className="room-types-value">{getRoomTypeDisplay()}</p>
      </div>

      <div className="occupancy-indicator">
        <div className="occupancy-header">
          <span>Occupancy</span>
          <span className="occupancy-percent">{getOccupancyRate()}%</span>
        </div>
        <div className="occupancy-bar">
          <div 
            className="occupancy-fill"
            style={{ width: `${getOccupancyRate()}%` }}
          />
        </div>
      </div>

      {floor.facilities && floor.facilities.length > 0 && (
        <div className="floor-facilities">
          {floor.facilities.slice(0, 3).map(facility => (
            <span key={facility} className="facility-badge">{facility}</span>
          ))}
          {floor.facilities.length > 3 && (
            <span className="facility-badge">+{floor.facilities.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default FloorCard;