const express = require('express');
const router = express.Router();
const { auth, isManager } = require('../Middleware/auth');
const Manager = require('../models/Manager');
const Student = require('../models/Student');
const User = require('../models/User');
const Room = require('../models/Room');
const Hall = require('../models/Hall');
const MealHistory = require('../models/MealHistory');
const Attendance = require('../models/Attendance');
const DailyMenu = require('../models/DailyMenu');
const DefaultMenu = require('../models/DefaultMenu');
const MealSelection = require('../models/MealSelection');
const Complaint = require('../models/Complaint');
const Payment = require('../models/Payment');

function normalizeDate(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Get manager profile
router.get('/profile', auth, isManager, async (req, res) => {
  try {
    const manager = await Manager.findOne({ userId: req.user.userId })
      .populate('hallId', 'name');
    
    if (!manager) {
      return res.status(404).json({ message: 'Manager profile not found' });
    }

    const managerData = {
      ...manager.toObject(),
      hallName: manager.hallId.name
    };

    res.json(managerData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get students under manager's hall
router.get('/students', auth, isManager, async (req, res) => {
  try {
    const manager = await Manager.findOne({ userId: req.user.userId });
    if (!manager) {
      return res.status(404).json({ message: 'Manager not found' });
    }

    const students = await Student.find({ hallId: manager.hallId })
      .populate('roomId', 'roomNumber')
      .sort('roomNumber');

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Register new student
router.post('/register-student', auth, isManager, async (req, res) => {
  try {
    const manager = await Manager.findOne({ userId: req.user.userId });
    if (!manager) {
      return res.status(404).json({ message: 'Manager not found' });
    }

    const {
      fullName, age, bloodGroup, department, studentId, phone, email,
      roomNumber, floorNumber, username, password, emergencyContact, address
    } = req.body;

    // Check if student ID already exists
    const existingStudent = await Student.findOne({ studentId });
    if (existingStudent) {
      return res.status(400).json({ message: 'Student ID already exists' });
    }

    // Check if username exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Find room
    const room = await Room.findOne({ 
      roomNumber, 
      hallId: manager.hallId 
    });

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.currentOccupancy >= room.capacity) {
      return res.status(400).json({ message: 'Room is full' });
    }

    // Create user account
    const user = new User({
      username,
      password,
      email,
      fullName,
      userType: 'student',
      instituteId: req.user.instituteId
    });

    await user.save();

    // Create student profile
    const student = new Student({
      userId: user._id,
      hallId: manager.hallId,
      roomId: room._id,
      fullName,
      age,
      bloodGroup,
      department,
      studentId,
      phone,
      email,
      roomNumber,
      floorNumber,
      emergencyContact,
      address
    });

    await student.save();

    // Update room occupancy
    room.occupants.push(user._id);
    room.currentOccupancy = room.occupants.length;
    await room.save();

    res.status(201).json({
      message: 'Student registered successfully',
      student: {
        id: student._id,
        fullName,
        studentId,
        roomNumber
      }
    });

  } catch (error) {
    console.error('Error registering student:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle meal status
router.put('/toggle-meal/:studentId', auth, isManager, async (req, res) => {
  try {
    const { mealStatus } = req.body;
    
    const student = await Student.findById(req.params.studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.mealStatus = mealStatus;
    await student.save();

    // Record in meal history
    await MealHistory.create({
      studentId: student._id,
      date: new Date(),
      status: mealStatus,
      changedBy: req.user.userId
    });

    res.json({ message: 'Meal status updated', mealStatus });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get attendance
router.get('/attendance', auth, isManager, async (req, res) => {
  try {
    const manager = await Manager.findOne({ userId: req.user.userId });
    const students = await Student.find({ hallId: manager.hallId });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.find({
      studentId: { $in: students.map(s => s._id) },
      date: { $gte: today }
    }).populate('studentId', 'fullName studentId roomNumber');

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ======== MENU MANAGEMENT ========

// Get default menu (fallback)
// (removed duplicate of '/menu/default')

// Get menu for a date (falls back to default)
router.get('/menu', auth, isManager, async (req, res) => {
  try {
    const manager = await Manager.findOne({ userId: req.user.userId });
    if (!manager) return res.status(404).json({ message: 'Manager not found' });

    const date = req.query.date ? normalizeDate(req.query.date) : normalizeDate(new Date());
    let menu = await DailyMenu.findOne({ hallId: manager.hallId, date });
    let defaultApplied = false;

    if (!menu) {
      const def = await DefaultMenu.findOne({ hallId: manager.hallId });
      if (!def) {
        return res.json({ meals: { breakfast: [], lunch: [], dinner: [] }, mealPrices: { breakfast: 0, lunch: 0, dinner: 0 }, defaultApplied: true });
      }
      defaultApplied = true;
      const sum = (items) => (items || []).reduce((t, i) => t + (i.price || 0), 0);
      return res.json({
        meals: def.meals,
        mealPrices: {
          breakfast: sum(def.meals.breakfast),
          lunch: sum(def.meals.lunch),
          dinner: sum(def.meals.dinner)
        },
        defaultApplied
      });
    }

    res.json({ meals: menu.meals, mealPrices: menu.mealPrices || { breakfast: 0, lunch: 0, dinner: 0 }, defaultApplied });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upsert daily menu for a date
router.post('/menu', auth, isManager, async (req, res) => {
  try {
    const manager = await Manager.findOne({ userId: req.user.userId });
    if (!manager) return res.status(404).json({ message: 'Manager not found' });

    const { date, meals, mealPrices } = req.body;
    const normalized = normalizeDate(date || new Date());

    const doc = await DailyMenu.findOneAndUpdate(
      { hallId: manager.hallId, date: normalized },
      {
        $set: {
          instituteId: req.user.instituteId,
          hallId: manager.hallId,
          date: normalized,
          meals,
          mealPrices: mealPrices || { breakfast: 0, lunch: 0, dinner: 0 },
          createdBy: req.user.userId
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json(doc);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get default menu (fallback)
router.get('/menu/default', auth, isManager, async (req, res) => {
  try {
    const manager = await Manager.findOne({ userId: req.user.userId });
    if (!manager) return res.status(404).json({ message: 'Manager not found' });
    const def = await DefaultMenu.findOne({ hallId: manager.hallId });
    res.json(def || { meals: { breakfast: [], lunch: [], dinner: [] } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Set default menu (fallback)
router.put('/menu/default', auth, isManager, async (req, res) => {
  try {
    const manager = await Manager.findOne({ userId: req.user.userId });
    if (!manager) return res.status(404).json({ message: 'Manager not found' });

    const { meals } = req.body;
    const doc = await DefaultMenu.findOneAndUpdate(
      { hallId: manager.hallId },
      {
        $set: {
          instituteId: req.user.instituteId,
          hallId: manager.hallId,
          meals,
          updatedBy: req.user.userId
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Manager dashboard meal stats (today + monthly)
router.get('/dashboard/meal-stats', auth, isManager, async (req, res) => {
  try {
    const manager = await Manager.findOne({ userId: req.user.userId });
    if (!manager) return res.status(404).json({ message: 'Manager not found' });

    const today = normalizeDate(new Date());
    const monthParam = req.query.month; // 'YYYY-MM'
    const startOfMonth = monthParam ? normalizeDate(new Date(`${monthParam}-01`)) : new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    // Today counts
    const todays = await MealSelection.find({ hallId: manager.hallId, date: today }).populate('studentId', 'fullName studentId');
    const count = {
      breakfast: todays.filter(s => s.breakfast).length,
      lunch: todays.filter(s => s.lunch).length,
      dinner: todays.filter(s => s.dinner).length
    };
    const turnedOn = todays.filter(s => s.breakfast || s.lunch || s.dinner).map(s => s.studentId);
    const turnedOff = todays.filter(s => !s.breakfast && !s.lunch && !s.dinner).map(s => s.studentId);

    // Monthly totals
    const monthSelections = await MealSelection.find({ hallId: manager.hallId, date: { $gte: startOfMonth, $lt: endOfMonth } });
    const monthly = monthSelections.reduce((acc, s) => {
      acc.breakfast += s.breakfast ? 1 : 0;
      acc.lunch += s.lunch ? 1 : 0;
      acc.dinner += s.dinner ? 1 : 0;
      acc.revenue += (s.prices?.breakfast || 0) + (s.prices?.lunch || 0) + (s.prices?.dinner || 0);
      return acc;
    }, { breakfast: 0, lunch: 0, dinner: 0, revenue: 0 });

    res.json({ today: count, todayTurnedOn: turnedOn, todayTurnedOff: turnedOff, monthly });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ======== COMPLAINT MANAGEMENT ========
// List complaints for students in manager's hall
router.get('/complaints', auth, isManager, async (req, res) => {
  try {
    const manager = await Manager.findOne({ userId: req.user.userId });
    if (!manager) return res.status(404).json({ message: 'Manager not found' });

    const students = await Student.find({ hallId: manager.hallId }).select('_id fullName');
    const studentIds = students.map(s => s._id);

    const complaints = await Complaint.find({ studentId: { $in: studentIds } })
      .sort('-createdAt')
      .populate('studentId', 'fullName');

    const payload = complaints.map(c => ({
      _id: c._id,
      subject: c.subject,
      description: c.description,
      category: c.category,
      createdAt: c.createdAt,
      resolvedAt: c.resolvedAt,
      status: c.status,
      resolved: c.status === 'resolved',
      student: { fullName: c.studentId?.fullName }
    }));

    res.json(payload);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update complaint resolved/unresolved
router.put('/complaints/:id', auth, isManager, async (req, res) => {
  try {
    const { resolved } = req.body;
    const comp = await Complaint.findById(req.params.id);
    if (!comp) return res.status(404).json({ message: 'Complaint not found' });

    comp.status = resolved ? 'resolved' : 'pending';
    comp.resolvedAt = resolved ? new Date() : undefined;
    await comp.save();

    res.json({
      _id: comp._id,
      subject: comp.subject,
      description: comp.description,
      category: comp.category,
      createdAt: comp.createdAt,
      resolvedAt: comp.resolvedAt,
      status: comp.status,
      resolved: comp.status === 'resolved'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ======== PAYMENTS MANAGEMENT ========
// List successful payments for students in manager's hall
router.get('/payments', auth, isManager, async (req, res) => {
  try {
    const manager = await Manager.findOne({ userId: req.user.userId });
    if (!manager) return res.status(404).json({ message: 'Manager not found' });

    const students = await Student.find({ hallId: manager.hallId }).select('_id fullName roomNumber studentId');
    const map = new Map(students.map(s => [String(s._id), s]));

    const payments = await Payment.find({ studentId: { $in: students.map(s => s._id) }, status: 'success' }).sort('-createdAt');
    const payload = payments.map(p => ({
      _id: p._id,
      tran_id: p.tran_id,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      createdAt: p.createdAt,
      receivedByManager: !!p.receivedByManager,
      receivedAt: p.receivedAt,
      student: map.get(String(p.studentId)) ? {
        fullName: map.get(String(p.studentId)).fullName,
        studentId: map.get(String(p.studentId)).studentId,
        roomNumber: map.get(String(p.studentId)).roomNumber
      } : undefined
    }));
    res.json(payload);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark payment as received by manager
router.put('/payments/:id/receive', auth, isManager, async (req, res) => {
  try {
    const doc = await Payment.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Payment not found' });
    if (doc.status !== 'success') return res.status(400).json({ message: 'Only successful payments can be received' });
    doc.receivedByManager = true;
    doc.receivedAt = new Date();
    await doc.save();
    res.json({ message: 'Marked as received', receivedByManager: true, receivedAt: doc.receivedAt });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ======== ROOM MANAGEMENT ========
// Remove student from room
router.put('/students/:studentId/remove-room', auth, isManager, async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const oldRoom = await Room.findById(student.roomId);
    if (oldRoom) {
      oldRoom.occupants = oldRoom.occupants.filter(id => String(id) !== String(student.userId));
      oldRoom.currentOccupancy = oldRoom.occupants.length;
      await oldRoom.save();
    }

    res.json({ message: 'Student removed from room successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Shift student to another room
router.put('/students/:studentId/shift-room', auth, isManager, async (req, res) => {
  try {
    const { newRoomNumber } = req.body;
    const student = await Student.findById(req.params.studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const manager = await Manager.findOne({ userId: req.user.userId });
    const newRoom = await Room.findOne({ roomNumber: newRoomNumber, hallId: manager.hallId });
    if (!newRoom) return res.status(404).json({ message: 'New room not found' });
    if (newRoom.currentOccupancy >= newRoom.capacity) {
      return res.status(400).json({ message: 'New room is full' });
    }

    const oldRoom = await Room.findById(student.roomId);
    if (oldRoom) {
      oldRoom.occupants = oldRoom.occupants.filter(id => String(id) !== String(student.userId));
      oldRoom.currentOccupancy = oldRoom.occupants.length;
      await oldRoom.save();
    }

    newRoom.occupants.push(student.userId);
    newRoom.currentOccupancy = newRoom.occupants.length;
    await newRoom.save();

    student.roomId = newRoom._id;
    student.roomNumber = newRoom.roomNumber;
    await student.save();

    res.json({ message: 'Student shifted to new room successfully', newRoomNumber });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;