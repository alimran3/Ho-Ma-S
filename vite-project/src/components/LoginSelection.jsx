import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './LoginSelection.css';

const LoginSelection = () => {
  const { instituteId } = useParams();
  const navigate = useNavigate();

  const userTypes = [
    {
      type: 'owner',
      title: 'Owner',
      icon: '👤',
      description: 'Institute owner access',
      color: '#4A90E2'
    },
    {
      type: 'manager',
      title: 'Manager',
      icon: '👨‍💼',
      description: 'Hall manager access',
      color: '#50C878'
    },
    {
      type: 'student',
      title: 'Student',
      icon: '🎓',
      description: 'Student portal access',
      color: '#FF6B6B'
    },
    {
      type: 'guest',
      title: 'Guest',
      icon: '🏠',
      description: 'Guest information access',
      color: '#FFD93D'
    }
  ];

  const handleUserTypeSelect = (userType) => {
    navigate(`/login/${instituteId}/${userType}`);
  };

  return (
    <div className="login-selection-container">
      <div className="selection-header">
        <h1>Select Login Type</h1>
        <p>Institute ID: {instituteId}</p>
      </div>
      
      <div className="user-type-grid">
        {userTypes.map((user) => (
          <div
            key={user.type}
            className="user-type-card"
            onClick={() => handleUserTypeSelect(user.type)}
            style={{ borderColor: user.color }}
          >
            <div className="card-icon" style={{ backgroundColor: user.color }}>
              {user.icon}
            </div>
            <h3>{user.title}</h3>
            <p>{user.description}</p>
          </div>
        ))}
      </div>
      
      <button onClick={() => navigate('/')} className="back-button">
        Back to Home
      </button>
    </div>
  );
};

export default LoginSelection;