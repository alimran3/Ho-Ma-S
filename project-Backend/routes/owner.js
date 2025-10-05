const express = require('express');
const router = express.Router();
const { auth, isOwner } = require('../Middleware/auth');
const Institute = require('../models/Institute');
const Hall = require('../models/Hall');
const Floor = require('../models/Floor');
const Room = require('../models/Room');
const User = require('../models/User');

// Get owner profile
router.get('/profile', auth, isOwner, async (req, res) => {
  try {
    const institute = await Institute.findOne({ instituteId: req.user.instituteId });
    const owner = await User.findById(req.user.userId);
    
    if (!institute) {
      return res.status(404).json({ message: 'Institute not found' });
    }

    res.json({
      ownerName: institute.ownerName,
      email: institute.email,
      instituteName: institute.name,
      eiin: institute.eiin,
      type: institute.type,
      location: institute.location,
      contact: institute.contact,
      address: institute.address
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get owner statistics
router.get('/stats', auth, isOwner, async (req, res) => {
  try {
    const halls = await Hall.find({ instituteId: req.user.instituteId });
    const floors = await Floor.find({ 
      hallId: { $in: halls.map(h => h._id) } 
    });
    const rooms = await Room.find({ 
      hallId: { $in: halls.map(h => h._id) } 
    });
    
    const stats = {
      totalHalls: halls.length,
      totalRooms: rooms.length,
      totalCapacity: halls.reduce((sum, hall) => sum + (hall.capacity || 0), 0),
      occupiedRooms: rooms.filter(room => room.status === 'occupied').length,
      totalFloors: floors.length,
      availableRooms: rooms.filter(room => room.status === 'available').length,
      maintenanceRooms: rooms.filter(room => room.status === 'maintenance').length
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get dashboard summary
router.get('/dashboard-summary', auth, isOwner, async (req, res) => {
  try {
    const halls = await Hall.find({ instituteId: req.user.instituteId })
      .populate('manager', 'fullName email')
      .limit(5)
      .sort('-createdAt');
    
    const recentActivities = await getRecentActivities(req.user.instituteId);
    
    res.json({
      recentHalls: halls,
      activities: recentActivities
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function for recent activities
async function getRecentActivities(instituteId) {
  // This would fetch recent activities like new students, payments, etc.
  return [
    { type: 'hall_created', message: 'New hall created', timestamp: new Date() },
    { type: 'manager_assigned', message: 'Manager assigned to hall', timestamp: new Date() }
  ];
}

module.exports = router;