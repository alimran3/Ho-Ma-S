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

module.exports = router;