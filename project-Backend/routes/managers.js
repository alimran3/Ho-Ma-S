const express = require('express');
const router = express.Router();
const { auth, isOwner } = require('../Middleware/auth');
const User = require('../models/User');
const Manager = require('../models/Manager');
const Hall = require('../models/Hall');

// Create manager with full details
router.post('/create-with-details', auth, isOwner, async (req, res) => {
  try {
    const {
      fullName, age, bloodGroup, rank, salary, phone, email,
      address, username, password, nid, joinDate, hallId
    } = req.body;

    // Check if username exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Create user account
    const user = new User({
      username,
      password,
      email,
      phone,
      fullName,
      userType: 'manager',
      instituteId: req.user.instituteId
    });

    await user.save();

    // Create manager profile
    const manager = new Manager({
      userId: user._id,
      hallId,
      fullName,
      age,
      bloodGroup,
      rank,
      salary,
      phone,
      email,
      address,
      nid,
      joinDate
    });

    await manager.save();

    res.status(201).json({
      message: 'Manager created successfully',
      manager: {
        id: manager._id,
        userId: user._id,
        fullName,
        email,
        username
      }
    });

  } catch (error) {
    console.error('Error creating manager:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get manager details
router.get('/:managerId', auth, async (req, res) => {
  try {
    const manager = await Manager.findById(req.params.managerId)
      .populate('userId', 'username email')
      .populate('hallId', 'name');
    
    if (!manager) {
      return res.status(404).json({ message: 'Manager not found' });
    }

    res.json(manager);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;