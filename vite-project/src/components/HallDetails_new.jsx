import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaHotel } from "react-icons/fa6";

const HallDetails = () => {
  const { hallId } = useParams();
  const navigate = useNavigate();
  const [hall, setHall] = useState(null);
  const [floors, setFloors] = useState([]);
  const [managers, setManagers] = useState([]);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [showCreateFloor, setShowCreateFloor] = useState(false);
  const [showAssignManager, setShowAssignManager] = useState(false);
  const [loading, setLoading] = useState(true);

  // Manager form state
  const [managerData, setManagerData] = useState({
    fullName: '',
    age: '',
    bloodGroup: '',
    rank: '',
    salary: '',
    phone: '',
    email: '',
    address: '',
    username: '',
    password: '',
    nid: '',
    joinDate: new Date().toISOString().split('T')[0]
  });

  // Floor form state
  const [floorData, setFloorData] = useState({
    floorNumber: '',
    name: '',
    description: '',
    facilities: [],
    totalRooms: ''
  });

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  const managerRanks = ['Junior Manager', 'Senior Manager', 'Head Manager', 'Assistant Manager'];
  const floorFacilities = ['Water Cooler', 'Common Bathroom', 'Study Room', 'WiFi', 'Security Camera', 'Emergency Exit'];

  useEffect(() => {
    fetchHallDetails();
    fetchFloors();
    fetchManagers();
  }, [hallId]);

  const fetchHallDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/halls/${hallId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHall(response.data);
      setSelectedManagerId(response.data.manager?._id || '');
    } catch (error) {
      console.error('Error fetching hall details:', error);
    }
  };

  const fetchFloors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/halls/${hallId}/floors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFloors(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching floors:', error);
      setLoading(false);
    }
  };

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

  const handleAssignManager = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');

      // Create manager account
      const managerResponse = await axios.post(
        '/api/managers/create-with-details',
        {
          ...managerData,
          hallId,
          instituteId: localStorage.getItem('instituteId')
        },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      // Assign manager to hall
      await axios.put(
        `/api/halls/${hallId}/assign-manager`,
        { managerId: managerResponse.data.manager.id },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      alert('Manager assigned successfully!');
      setShowAssignManager(false);
      fetchHallDetails();
      resetManagerForm();
    } catch (error) {
      console.error('Error assigning manager:', error);
      alert('Failed to assign manager: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const handleCreateFloor = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');

      await axios.post(
        `/api/halls/${hallId}/floors/create-with-details`,
        floorData,
        { headers: { Authorization: `Bearer ${token}` }}
      );

      alert('Floor created successfully with rooms!');
      setShowCreateFloor(false);
      setFloorData({
        floorNumber: '',
        name: '',
        description: '',
        facilities: [],
        totalRooms: ''
      });
      fetchFloors();
      fetchHallDetails();
    } catch (error) {
      console.error('Error creating floor:', error);
      alert('Failed to create floor: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const resetManagerForm = () => {
    setManagerData({
      fullName: '',
      age: '',
      bloodGroup: '',
      rank: '',
      salary: '',
      phone: '',
      email: '',
      address: '',
      username: '',
      password: '',
      nid: '',
      joinDate: new Date().toISOString().split('T')[0]
    });
  };

  const handleFacilityToggle = (facility) => {
    const updatedFacilities = floorData.facilities.includes(facility)
      ? floorData.facilities.filter(f => f !== facility)
      : [...floorData.facilities, facility];
    setFloorData({ ...floorData, facilities: updatedFacilities });
  };

  if (!hall || loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#F9F3EF'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #456882',
          borderTop: '4px solid #1B3C53',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{
          marginTop: '16px',
          color: '#456882',
          fontSize: '1rem'
        }}>Loading hall details...</p>
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
          }}>Hall Management</h2>
          <p style={{
            margin: 0,
            color: '#456882',
            fontSize: '0.9rem'
          }}>Manage your hall operations</p>
        </div>

        <div style={{
