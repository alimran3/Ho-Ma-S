import React from 'react';
import './HallCard.css';

const HallCard = ({ hall, onClick }) => {
  const getOccupancyPercentage = () => {
    if (!hall.totalRooms || hall.totalRooms === 0) return 0;
    return Math.round((hall.occupiedRooms / hall.totalRooms) * 100);
  };

  const getStatusColor = () => {
    const percentage = getOccupancyPercentage();
    if (percentage >= 90) return '#e53e3e';
    if (percentage >= 70) return '#ed8936';
    return '#38a169';
  };

  return (
    <div className="hall-card" onClick={onClick}>
      <div className="hall-card-header">
        <h3>{hall.name}</h3>
        <span className={`status-badge ${hall.isActive ? 'active' : 'inactive'}`}>
          {hall.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="hall-info">
        <div className="info-row">
          <span className="icon">📍</span>
          <span>{hall.location}</span>
        </div>
        <div className="info-row">
          <span className="icon">👥</span>
          <span>Capacity: {hall.capacity} students</span>
        </div>
        <div className="info-row">
          <span className="icon">🏠</span>
          <span>{hall.type} Hall</span>
        </div>
        {hall.manager && (
          <div className="info-row">
            <span className="icon">👨‍💼</span>
            <span>Manager: {hall.manager.fullName}</span>
          </div>
        )}
      </div>

      <div className="hall-stats">
        <div className="stat">
          <span className="stat-value">{hall.totalFloors || 0}</span>
          <span className="stat-label">Floors</span>
        </div>
        <div className="stat">
          <span className="stat-value">{hall.totalRooms || 0}</span>
          <span className="stat-label">Rooms</span>
        </div>
        <div className="stat">
          <span className="stat-value">{hall.occupiedRooms || 0}</span>
          <span className="stat-label">Occupied</span>
        </div>
      </div>

      <div className="occupancy-bar">
        <div className="occupancy-label">
          <span>Occupancy</span>
          <span>{getOccupancyPercentage()}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ 
              width: `${getOccupancyPercentage()}%`,
              backgroundColor: getStatusColor()
            }}
          />
        </div>
      </div>

      {hall.facilities && hall.facilities.length > 0 && (
        <div className="facilities-tags">
          {hall.facilities.slice(0, 3).map(facility => (
            <span key={facility} className="facility-tag">{facility}</span>
          ))}
          {hall.facilities.length > 3 && (
            <span className="facility-tag">+{hall.facilities.length - 3} more</span>
          )}
        </div>
      )}
    </div>
  );
};

export default HallCard;