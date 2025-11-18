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
      icon: '●',
      description: 'Institute owner access',
      color: '#4A90E2'
    },
    {
      type: 'manager',
      title: 'Manager',
      icon: '',
      description: 'Hall manager access',
      color: '#50C878'
    },
    {
      type: 'student',
      title: 'Student',
      icon: '▲',
      description: 'Student portal access',
      color: '#FF6B6B'
    },
    {
      type: 'guest',
      title: 'Guest',
      icon: '◆',
      description: 'Guest information access',
      color: '#FFD93D'
    }
  ];

  const handleUserTypeSelect = (userType) => {
    navigate(`/login/${instituteId}/${userType}`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1B3C53',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '40px'
      }}>
        <h1 style={{
          color: '#F9F3EF',
          fontSize: '2.5rem',
          fontWeight: 700,
          marginBottom: '10px',
          letterSpacing: '-0.02em'
        }}>Select Login Type</h1>
        <p style={{
          color: '#456882',
          fontSize: '1.1rem',
          fontWeight: 500
        }}>Institute ID: {instituteId}</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '24px',
        width: '100%',
        maxWidth: '800px',
        marginBottom: '40px'
      }}>
        {userTypes.map((user) => (
          <div
            key={user.type}
            onClick={() => handleUserTypeSelect(user.type)}
            style={{
              backgroundColor: '#F9F3EF',
              border: `2px solid ${user.color}`,
              borderRadius: '16px',
              padding: '32px 24px',
              cursor: 'pointer',
              textAlign: 'center',
              boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease',
              ':hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 35px rgba(0,0,0,0.15)'
              }
            }}
          >
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: user.color,
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '2.5rem'
            }}>
              {user.icon}
            </div>
            <h3 style={{
              color: '#1B3C53',
              fontSize: '1.5rem',
              fontWeight: 600,
              marginBottom: '8px',
              letterSpacing: '-0.01em'
            }}>{user.title}</h3>
            <p style={{
              color: '#456882',
              fontSize: '1rem',
              fontWeight: 500,
              margin: 0
            }}>{user.description}</p>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate('/')}
        style={{
          padding: '14px 28px',
          backgroundColor: '#456882',
          color: '#F9F3EF',
          border: 'none',
          borderRadius: '12px',
          fontSize: '1.1rem',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}
      >
        Back to Home
      </button>
    </div>
  );
};

export default LoginSelection;