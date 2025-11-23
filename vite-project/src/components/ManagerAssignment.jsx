// ManagerAssignment.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ManagerAssignment.css';

const ManagerAssignment = ({ currentManager, onClose, onAssign }) => {
  const [managers, setManagers] = useState([]);
  const [selectedManagerId, setSelectedManagerId] = useState(currentManager?._id || '');
  const [newManager, setNewManager] = useState({
    fullName: '',
    email: '',
    phone: '',
    username: '',
    password: ''
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchManagers();
  }, []);

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

  const handleCreateManager = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/managers/create',
        newManager,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      alert('Manager created successfully!');
      fetchManagers();
      setShowCreateForm(false);
      setNewManager({
        fullName: '',
        email: '',
        phone: '',
        username: '',
        password: ''
      });
    } catch (error) {
      console.error('Error creating manager:', error);
      setErrors({ submit: error.response?.data?.message || 'Failed to create manager' });
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = () => {
    if (selectedManagerId) {
      onAssign(selectedManagerId);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewManager({ ...newManager, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="manager-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Manage Hall Manager</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {!showCreateForm ? (
          <div className="manager-selection">
            <div className="current-manager-section">
              <h3>Current Manager</h3>
              {currentManager ? (
                <div className="current-manager-card">
                  <div className="manager-avatar">
                    {currentManager.fullName.charAt(0)}
                  </div>
                  <div className="manager-info">
                    <h4>{currentManager.fullName}</h4>
                    <p>{currentManager.email}</p>
                    <p>{currentManager.phone}</p>
                  </div>
                </div>
              ) : (
                <p className="no-manager">No manager assigned</p>
              )}
            </div>

            <div className="available-managers-section">
              <h3>Available Managers</h3>
              <div className="managers-list">
                {managers.length === 0 ? (
                  <p className="no-managers">No managers available</p>
                ) : (
                  managers.map(manager => (
                    <label key={manager._id} className="manager-option">
                      <input
                        type="radio"
                        name="manager"
                        value={manager._id}
                        checked={selectedManagerId === manager._id}
                        onChange={(e) => setSelectedManagerId(e.target.value)}
                      />
                      <div className="manager-option-content">
                        <div className="manager-avatar-small">
                          {manager.fullName.charAt(0)}
                        </div>
                        <div className="manager-details">
                          <h4>{manager.fullName}</h4>
                          <p>{manager.email}</p>
                          <p className="assigned-halls">
                            {manager.assignedHalls?.length || 0} halls assigned
                          </p>
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                className="create-manager-btn"
                onClick={() => setShowCreateForm(true)}
              >
                Create New Manager
              </button>
              <div className="action-buttons">
                <button className="cancel-btn" onClick={onClose}>
                  Cancel
                </button>
                <button 
                  className="submit-btn" 
                  onClick={handleAssign}
                  disabled={!selectedManagerId}
                >
                  Assign Manager
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="create-manager-form">
            <h3>Create New Manager</h3>
            <form onSubmit={handleCreateManager}>
              {errors.submit && (
                <div className="error-banner">{errors.submit}</div>
              )}

              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name <span className="required">*</span></label>
                  <input
                    type="text"
                    name="fullName"
                    value={newManager.fullName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email <span className="required">*</span></label>
                  <input
                    type="email"
                    name="email"
                    value={newManager.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone <span className="required">*</span></label>
                  <input
                    type="tel"
                    name="phone"
                    value={newManager.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Username <span className="required">*</span></label>
                  <input
                    type="text"
                    name="username"
                    value={newManager.username}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label>Password <span className="required">*</span></label>
                  <input
                    type="password"
                    name="password"
                    value={newManager.password}
                    onChange={handleInputChange}
                    required
                    minLength="6"
                  />
                  <span className="help-text">Minimum 6 characters</span>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowCreateForm(false)}
                >
                  Back
                </button>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Manager'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerAssignment;