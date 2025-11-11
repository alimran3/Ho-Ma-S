const express = require('express');
const router = express.Router();
const { auth } = require('../Middleware/auth');
const Student = require('../models/Student');
const Room = require('../models/Room');
const MealHistory = require('../models/MealHistory');
const Attendance = require('../models/Attendance');
const Complaint = require('../models/Complaint');
const Hall = require('../models/Hall');
const DailyMenu = require('../models/DailyMenu');
const DefaultMenu = require('../models/DefaultMenu');
const MealSelection = require('../models/MealSelection');

function normalizeDate(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

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

// Get today's selection to prefill toggles
router.get('/meals/today', auth, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.userId });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const now = new Date();
    const base = normalizeDate(now);
    let date = base;
    if (req.query.next === '1') {
      date = normalizeDate(new Date(base.getTime() + 24*60*60*1000));
    } else if (req.query.effective === '1') {
      // Effective target: 22:00 of D -> 10:59 of D+1 applies to D+1
      const hour = now.getHours();
      if (hour >= 22) date = normalizeDate(new Date(base.getTime() + 24*60*60*1000));
      else if (hour < 11) date = base; // morning window applies to today
      else date = base; // outside window, show today by default
    }
    const sel = await MealSelection.findOne({ studentId: student._id, date });
    if (sel) {
      const resp = sel.toObject();
      resp.breakfast = true; // mandatory
      resp.mealStatus = student.mealStatus;
      return res.json(resp);
    }
    // Default: all meals ON if mealStatus is true
    res.json({ date, breakfast: true, lunch: student.mealStatus, dinner: student.mealStatus, mealStatus: student.mealStatus, prices: { breakfast: 0, lunch: 0, dinner: 0 } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ===== New Meal APIs =====

// Get menu for a date (with fallback to default)
router.get('/menu', auth, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.userId });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const date = req.query.date ? normalizeDate(req.query.date) : normalizeDate(new Date());

    const menu = await DailyMenu.findOne({ hallId: student.hallId, date });
    if (menu) {
      return res.json({ meals: menu.meals, mealPrices: menu.mealPrices || { breakfast: 0, lunch: 0, dinner: 0 }, defaultApplied: false });
    }
    const def = await DefaultMenu.findOne({ hallId: student.hallId });
    if (!def) {
      return res.json({ meals: { breakfast: [], lunch: [], dinner: [] }, mealPrices: { breakfast: 0, lunch: 0, dinner: 0 }, defaultApplied: true });
    }
    const sum = (items) => (items || []).reduce((t, i) => t + (i.price || 0), 0);
    return res.json({
      meals: def.meals,
      mealPrices: {
        breakfast: sum(def.meals.breakfast),
        lunch: sum(def.meals.lunch),
        dinner: sum(def.meals.dinner)
      },
      defaultApplied: true
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Student meal selection per meal allowed only between 10:00 PM and 11:00 AM
router.put('/meals/select', auth, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.userId });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const { lunch = true, dinner = true } = req.body;
    const now = new Date();
    const today = normalizeDate(now);
    const nextDay = normalizeDate(new Date(today.getTime() + 24*60*60*1000));

    // Time window: For date D, allowed from D-1 22:00 to D 10:59
    const hour = now.getHours();
    const allowed = (hour >= 22) || (hour < 11);
    if (!allowed) {
      return res.status(403).json({ message: 'Selections allowed only between 10:00 PM and 11:00 AM' });
    }

    // If hour >= 22, select for tomorrow (D+1). If hour < 11, select for today (D)
    const targetDate = (hour >= 22) ? nextDay : today;

    // Get prices from daily or default menu
    const daily = await DailyMenu.findOne({ hallId: student.hallId, date: targetDate });
    let prices = daily?.mealPrices;
    if (!prices) {
      const def = await DefaultMenu.findOne({ hallId: student.hallId });
      const sum = (items) => (items || []).reduce((t, i) => t + (i.price || 0), 0);
      prices = {
        breakfast: sum(def?.meals?.breakfast),
        lunch: sum(def?.meals?.lunch),
        dinner: sum(def?.meals?.dinner)
      };
    }

    // If mealStatus is OFF, all meals are OFF
    const doc = await MealSelection.findOneAndUpdate(
      { studentId: student._id, date: targetDate },
      {
        $set: {
          hallId: student.hallId,
          instituteId: student.instituteId,
          date: targetDate,
          breakfast: student.mealStatus ? true : false,
          lunch: student.mealStatus ? !!lunch : false,
          dinner: student.mealStatus ? !!dinner : false,
          prices
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Student meal history with totals (last N days, default 30)
router.get('/meals/history', auth, async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 30, 60);
    const student = await Student.findOne({ userId: req.user.userId });
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const selections = await MealSelection.find({ studentId: student._id, date: { $gte: since } }).sort('date');
    let running = 0;
    const history = selections.map(s => {
      const dayTotal = (s.breakfast ? (s.prices?.breakfast || 0) : 0) +
                      (s.lunch ? (s.prices?.lunch || 0) : 0) +
                      (s.dinner ? (s.prices?.dinner || 0) : 0);
      running += dayTotal;
      return {
        date: s.date,
        meals: {
          breakfast: s.breakfast,
          lunch: s.lunch,
          dinner: s.dinner
        },
        prices: s.prices || { breakfast: 0, lunch: 0, dinner: 0 },
        dayTotal,
        runningTotal: running
      };
    });

    res.json(history.reverse());
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

// Toggle meal status (master switch)
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

    // Update today's meal selection based on new status
    const now = new Date();
    const today = normalizeDate(now);
    const hour = now.getHours();
    const targetDate = (hour >= 22) ? normalizeDate(new Date(today.getTime() + 24*60*60*1000)) : today;
    
    await MealSelection.findOneAndUpdate(
      { studentId: student._id, date: targetDate },
      {
        $set: {
          breakfast: student.mealStatus,
          lunch: student.mealStatus,
          dinner: student.mealStatus
        }
      },
      { upsert: false }
    );

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
    if (!student) return res.status(404).json({ message: 'Student not found' });
    
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