const express = require('express');
const router = express.Router();
const { auth, isOwner } = require('../Middleware/auth');
const Institute = require('../models/Institute');
const Hall = require('../models/Hall');
const Floor = require('../models/Floor');
const Room = require('../models/Room');
const User = require('../models/User');
const Manager = require('../models/Manager');
const Student = require('../models/Student');
const MealSelection = require('../models/MealSelection');
const Payment = require('../models/Payment');

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

// Get all managers for the institute
router.get('/managers', auth, isOwner, async (req, res) => {
  try {
    const halls = await Hall.find({ instituteId: req.user.instituteId });
    const hallIds = halls.map(h => h._id);

    const managers = await Manager.find({ hallId: { $in: hallIds } })
      .populate('hallId', 'name')
      .populate('userId', 'email')
      .select('fullName rank salary phone email hallId userId');

    // Transform the data to include email from userId
    const transformedManagers = managers.map(manager => ({
      _id: manager._id,
      fullName: manager.fullName,
      rank: manager.rank,
      salary: manager.salary,
      phone: manager.phone,
      email: manager.userId?.email || manager.email,
      hallName: manager.hallId?.name || 'Not Assigned'
    }));

    res.json(transformedManagers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all students for the institute
router.get('/students', auth, isOwner, async (req, res) => {
  try {
    const halls = await Hall.find({ instituteId: req.user.instituteId });
    const hallIds = halls.map(h => h._id);

    const students = await Student.find({ hallId: { $in: hallIds } })
      .populate('hallId', 'name')
      .select('fullName studentId department roomNumber email phone mealStatus');

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get meal statistics for the institute
router.get('/meal-stats', auth, isOwner, async (req, res) => {
  try {
    const halls = await Hall.find({ instituteId: req.user.instituteId });
    const hallIds = halls.map(h => h._id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    // Today's meal selections
    const todaysSelections = await MealSelection.find({
      hallId: { $in: hallIds },
      date: today
    });

    const todayStats = todaysSelections.reduce((acc, sel) => {
      acc.breakfast += sel.breakfast ? 1 : 0;
      acc.lunch += sel.lunch ? 1 : 0;
      acc.dinner += sel.dinner ? 1 : 0;
      return acc;
    }, { breakfast: 0, lunch: 0, dinner: 0 });

    // Monthly meal selections
    const monthlySelections = await MealSelection.find({
      hallId: { $in: hallIds },
      date: { $gte: monthStart, $lt: monthEnd }
    });

    const monthlyStats = monthlySelections.reduce((acc, sel) => {
      acc.breakfast += sel.breakfast ? 1 : 0;
      acc.lunch += sel.lunch ? 1 : 0;
      acc.dinner += sel.dinner ? 1 : 0;
      acc.totalMeals += (sel.breakfast ? 1 : 0) + (sel.lunch ? 1 : 0) + (sel.dinner ? 1 : 0);
      acc.totalRevenue += (sel.prices?.breakfast || 0) + (sel.prices?.lunch || 0) + (sel.prices?.dinner || 0);
      return acc;
    }, { breakfast: 0, lunch: 0, dinner: 0, totalMeals: 0, totalRevenue: 0 });

    res.json({
      totalMeals: monthlyStats.totalMeals,
      totalRevenue: monthlyStats.totalRevenue,
      breakfast: monthlyStats.breakfast,
      lunch: monthlyStats.lunch,
      dinner: monthlyStats.dinner
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get payment statistics for the institute
router.get('/payment-stats', auth, isOwner, async (req, res) => {
  try {
    const halls = await Hall.find({ instituteId: req.user.instituteId });
    const hallIds = halls.map(h => h._id);

    const students = await Student.find({ hallId: { $in: hallIds } }).select('_id');
    const studentIds = students.map(s => s._id);

    const payments = await Payment.find({ studentId: { $in: studentIds } });

    const stats = payments.reduce((acc, payment) => {
      acc.totalPayments += 1;
      acc.totalAmount += payment.amount || 0;
      if (payment.status === 'success') {
        acc.received += 1;
      } else {
        acc.pending += 1;
      }
      return acc;
    }, { totalPayments: 0, totalAmount: 0, received: 0, pending: 0 });

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get hall statistics for the institute
router.get('/hall-stats', auth, isOwner, async (req, res) => {
  try {
    const halls = await Hall.find({ instituteId: req.user.instituteId });
    const floors = await Floor.find({ hallId: { $in: halls.map(h => h._id) } });
    const rooms = await Room.find({ hallId: { $in: halls.map(h => h._id) } });

    const stats = {
      totalHalls: halls.length,
      totalRooms: rooms.length,
      occupiedRooms: rooms.filter(r => r.status === 'occupied').length,
      vacantRooms: rooms.filter(r => r.status === 'available').length
    };

    res.json(stats);
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