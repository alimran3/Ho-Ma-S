const express = require('express');
const router = express.Router();
const { auth } = require('../Middleware/auth');
const Student = require('../models/Student');
const Room = require('../models/Room');
const MealHistory = require('../models/MealHistory');
const Attendance = require('../models/Attendance');
const Complaint = require('../models/Complaint');
const Hall = require('../models/Hall');

// Get student profile
router.get('/profile', auth, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.userId })
      .populate('hallId', 'name');
    
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const studentData = {
      ...student.toObject(),
      hallName: student.hallId.name
    };

    res.json(studentData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get roommates
router.get('/roommates', auth, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.userId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const room = await Room.findById(student.roomId)
      .populate({
        path: 'occupants',
        select: 'fullName'
      });

    const roommates = await Student.find({
      roomId: student.roomId,
      _id: { $ne: student._id }
    }).select('fullName studentId department bloodGroup phone');

    res.json(roommates);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get meal history
router.get('/meal-history', auth, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.userId });
    
    const history = await MealHistory.find({ studentId: student._id })
      .sort('-date')
      .limit(30);

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle meal status
router.put('/toggle-meal', auth, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.userId });
    
    student.mealStatus = !student.mealStatus;
    await student.save();

    // Record in meal history
    await MealHistory.create({
      studentId: student._id,
      date: new Date(),
      status: student.mealStatus,
      changedBy: req.user.userId
    });

    res.json({ message: 'Meal status updated', mealStatus: student.mealStatus });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get attendance history
router.get('/attendance-history', auth, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.userId });
    
    const attendance = await Attendance.find({ studentId: student._id })
      .sort('-date')
      .limit(30);

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit complaint
router.post('/complaint', auth, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.userId });
    const { category, subject, description } = req.body;

    const complaint = new Complaint({
      studentId: student._id,
      category,
      subject,
      description
    });

    await complaint.save();

    res.status(201).json({ message: 'Complaint submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;