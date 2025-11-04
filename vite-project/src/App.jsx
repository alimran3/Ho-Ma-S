import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import LoginSelection from './components/LoginSelection';
import LoginPage from './components/LoginPage';
import OwnerDashboard from './components/OwnerDashboard';
import HallDetails from './components/HallDetails';
import FloorDetails from './components/FloorDetails';
import ManagerDashboard from './components/ManagerDashboard';
import StudentDashboard from './components/StudentDashboard';
import GuestView from './components/GuestView';
import PaymentResult from './components/PaymentResult';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children, allowedUserTypes }) => {
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('userType');
  
  if (!token) {
    return <Navigate to="/" replace />;
  }
  
  if (allowedUserTypes && !allowedUserTypes.includes(userType)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login-selection/:instituteId" element={<LoginSelection />} />
          <Route path="/login/:instituteId/:userType" element={<LoginPage />} />
          
          {/* Owner Routes */}
          <Route 
            path="/owner/dashboard" 
            element={
              <ProtectedRoute allowedUserTypes={['owner']}>
                <OwnerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/owner/hall/:hallId" 
            element={
              <ProtectedRoute allowedUserTypes={['owner']}>
                <HallDetails />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/owner/floor/:floorId" 
            element={
              <ProtectedRoute allowedUserTypes={['owner']}>
                <FloorDetails />
              </ProtectedRoute>
            } 
          />
          
          {/* Manager Routes */}
          <Route 
            path="/manager/dashboard" 
            element={
              <ProtectedRoute allowedUserTypes={['manager']}>
                <ManagerDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Student Routes */}
          <Route 
            path="/student/dashboard" 
            element={
              <ProtectedRoute allowedUserTypes={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Payment Result Routes (public redirect targets) */}
          <Route path="/payment/success" element={<PaymentResult type="success" />} />
          <Route path="/payment/fail" element={<PaymentResult type="fail" />} />
          <Route path="/payment/cancel" element={<PaymentResult type="cancel" />} />
          
          {/* Guest Routes */}
          <Route 
            path="/guest/info" 
            element={
              <ProtectedRoute allowedUserTypes={['guest']}>
                <GuestView />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;