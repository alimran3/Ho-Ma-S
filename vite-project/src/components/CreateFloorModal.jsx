import React, { useState } from 'react';
import './CreateFloorModal.css';
import './CreateHallModal.css';

const CreateFloorModal = ({ onClose, onCreate, hallName }) => {
  const [formData, setFormData] = useState({
    floorNumber: '',
    name: '',
    totalRooms: '',
    roomsPerType: {
      single: 0,
      double: 0,
      triple: 0,
      dormitory: 0
    },
    pricePerBed: '',
    facilities: [],
    roomFacilities: []
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const floorFacilities = [
    'Water Cooler', 'Common Bathroom', 'Common Kitchen', 'Study Area',
    'Lounge', 'Emergency Exit', 'Fire Extinguisher', 'CCTV'
  ];

  const roomFacilitiesList = [
    'Attached Bathroom', 'Balcony', 'AC', 'Fan', 'Study Table',
    'Wardrobe', 'Bed', 'Chair', 'Mirror', 'Curtains'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleRoomTypeChange = (type, value) => {
    const numValue = parseInt(value) || 0;
    setFormData({
      ...formData,
      roomsPerType: { ...formData.roomsPerType, [type]: numValue }
    });
    
    
    const total = Object.values({ ...formData.roomsPerType, [type]: numValue })
      .reduce((sum, count) => sum + count, 0);
    setFormData(prev => ({ ...prev, totalRooms: total.toString() }));
  };

  const handleFacilityToggle = (facility, type) => {
    const facilityArray = type === 'floor' ? 'facilities' : 'roomFacilities';
    const currentFacilities = formData[facilityArray];
    
    const updatedFacilities = currentFacilities.includes(facility)
      ? currentFacilities.filter(f => f !== facility)
      : [...currentFacilities, facility];
      
    setFormData({ ...formData, [facilityArray]: updatedFacilities });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.floorNumber) {
      newErrors.floorNumber = 'Floor number is required';
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Floor name is required';
    }
    
    const totalRooms = Object.values(formData.roomsPerType)
      .reduce((sum, count) => sum + count, 0);
    
    if (totalRooms === 0) {
      newErrors.rooms = 'At least one room must be added';
    }
    
    if (!formData.pricePerBed || formData.pricePerBed <= 0) {
      newErrors.pricePerBed = 'Valid price per bed is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      await onCreate(formData);
      onClose();
    } catch (error) {
      console.error('Error creating floor:', error);
      setErrors({ submit: 'Failed to create floor. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="floor-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Add New Floor</h2>
            <p className="modal-subtitle">For {hallName}</p>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="floor-form">
          {errors.submit && (
            <div className="error-banner">{errors.submit}</div>
          )}

          <div className="form-section">
            <h3>Floor Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Floor Number <span className="required">*</span></label>
                <input
                  type="number"
                  name="floorNumber"
                  value={formData.floorNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., 1, 2, 3"
                  min="0"
                  className={errors.floorNumber ? 'error' : ''}
                />
                {errors.floorNumber && <span className="error-text">{errors.floorNumber}</span>}
              </div>

              <div className="form-group">
                <label>Floor Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., First Floor, Ground Floor"
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label>Price per Bed (Monthly) <span className="required">*</span></label>
                <input
                  type="number"
                  name="pricePerBed"
                  value={formData.pricePerBed}
                  onChange={handleInputChange}
                  placeholder="e.g., 5000"
                  min="0"
                  className={errors.pricePerBed ? 'error' : ''}
                />
                {errors.pricePerBed && <span className="error-text">{errors.pricePerBed}</span>}
              </div>

              <div className="form-group">
                <label>Total Rooms</label>
                <input
                  type="number"
                  value={formData.totalRooms}
                  readOnly
                  className="readonly-input"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Room Configuration</h3>
            {errors.rooms && <div className="error-text">{errors.rooms}</div>}
            <div className="room-types-grid">
              <div className="room-type-item">
                <label>Single Rooms</label>
                <input
                  type="number"
                  value={formData.roomsPerType.single}
                  onChange={(e) => handleRoomTypeChange('single', e.target.value)}
                  min="0"
                  placeholder="0"
                />
                <span className="room-capacity">1 bed each</span>
              </div>

              <div className="room-type-item">
                <label>Double Rooms</label>
                <input
                  type="number"
                  value={formData.roomsPerType.double}
                  onChange={(e) => handleRoomTypeChange('double', e.target.value)}
                  min="0"
                  placeholder="0"
                />
                <span className="room-capacity">2 beds each</span>
              </div>

              <div className="room-type-item">
                <label>Triple Rooms</label>
                <input
                  type="number"
                  value={formData.roomsPerType.triple}
                  onChange={(e) => handleRoomTypeChange('triple', e.target.value)}
                  min="0"
                  placeholder="0"
                />
                <span className="room-capacity">3 beds each</span>
              </div>

              <div className="room-type-item">
                <label>Dormitory</label>
                <input
                  type="number"
                  value={formData.roomsPerType.dormitory}
                  onChange={(e) => handleRoomTypeChange('dormitory', e.target.value)}
                  min="0"
                  placeholder="0"
                />
                <span className="room-capacity">4+ beds each</span>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Floor Facilities</h3>
            <div className="facilities-grid">
              {floorFacilities.map(facility => (
                <label key={facility} className="facility-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.facilities.includes(facility)}
                    onChange={() => handleFacilityToggle(facility, 'floor')}
                  />
                  <span className="checkbox-label">{facility}</span>
                  <span className="checkmark"></span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-section">
            <h3>Default Room Facilities</h3>
            <div className="facilities-grid">
              {roomFacilitiesList.map(facility => (
                <label key={facility} className="facility-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.roomFacilities.includes(facility)}
                    onChange={() => handleFacilityToggle(facility, 'room')}
                  />
                  <span className="checkbox-label">{facility}</span>
                  <span className="checkmark"></span>
                </label>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="btn-spinner"></span>
                  Creating Floor...
                </>
              ) : (
                'Create Floor'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFloorModal;