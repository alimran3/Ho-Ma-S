import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CreateHallModal.css';

const CreateHallModal = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    capacity: '',
    type: 'boys',
    facilities: [],
    managerId: '',
    description: '',
    isActive: true
  });
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);

  const facilitiesList = [
    'WiFi', 'Laundry', 'Gym', 'Common Room', 'Study Room', 
    'Kitchen', 'Security', 'Parking', 'Garden', 'Library'
  ];

  useEffect(() => {
    fetchAvailableManagers();
  }, []);

  const fetchAvailableManagers = async () => {
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFacilityToggle = (facility) => {
    const updatedFacilities = formData.facilities.includes(facility)
      ? formData.facilities.filter(f => f !== facility)
      : [...formData.facilities, facility];
    setFormData({ ...formData, facilities: updatedFacilities });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreate(formData);
    } catch (error) {
      console.error('Error creating hall:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Hall</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="hall-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Hall Name <span className="required">*</span></label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., North Wing Hall"
                required
              />
            </div>

            <div className="form-group">
              <label>Location <span className="required">*</span></label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Building A, Campus North"
                required
              />
            </div>

            <div className="form-group">
              <label>Capacity <span className="required">*</span></label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleInputChange}
                placeholder="Total student capacity"
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label>Hall Type <span className="required">*</span></label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
              >
                <option value="boys">Boys Hall</option>
                <option value="girls">Girls Hall</option>
                <option value="mixed">Mixed Hall</option>
              </select>
            </div>

            <div className="form-group">
              <label>Assign Manager</label>
              <select
                name="managerId"
                value={formData.managerId}
                onChange={handleInputChange}
              >
                <option value="">Select a manager (optional)</option>
                {managers.map(manager => (
                  <option key={manager._id} value={manager._id}>
                    {manager.fullName} - {manager.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description about the hall"
                rows="3"
              />
            </div>
          </div>

          <div className="facilities-section">
            <label>Facilities</label>
            <div className="facilities-grid">
              {facilitiesList.map(facility => (
                <label key={facility} className="facility-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.facilities.includes(facility)}
                    onChange={() => handleFacilityToggle(facility)}
                  />
                  <span>{facility}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
              />
              <span>Set as Active</span>
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Creating...' : 'Create Hall'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateHallModal;