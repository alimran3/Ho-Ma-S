const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Institute = require('../models/Institute');
const User = require('../models/User');

// Generate unique institute ID
const generateInstituteId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 7);
  return `INST-${timestamp}-${randomStr}`.toUpperCase();
};

// Register new institute
router.post('/register', [
  body('eiin').notEmpty().withMessage('EIIN is required'),
  body('name').notEmpty().withMessage('Institute name is required'),
  body('type').isIn(['university', 'college', 'school', 'private']).withMessage('Invalid institute type'),
  body('location').notEmpty().withMessage('Location is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('ownerName').notEmpty().withMessage('Owner name is required'),
  body('contact').notEmpty().withMessage('Contact number is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('username').isLength({ min: 4 }).withMessage('Username must be at least 4 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if EIIN or email already exists
    const existingInstitute = await Institute.findOne({ 
      $or: [
        { eiin: req.body.eiin },
        { email: req.body.email }
      ]
    });
    
    if (existingInstitute) {
      return res.status(400).json({ 
        message: existingInstitute.eiin === req.body.eiin 
          ? 'EIIN already registered' 
          : 'Email already registered' 
      });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username: req.body.username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Generate unique institute ID
    const instituteId = generateInstituteId();

    // Create new institute
    const newInstitute = new Institute({
      instituteId,
      eiin: req.body.eiin,
      name: req.body.name,
      type: req.body.type,
      location: req.body.location,
      address: req.body.address,
      ownerName: req.body.ownerName,
      contact: req.body.contact,
      email: req.body.email,
      isActive: true
    });

    await newInstitute.save();

    // Create owner account
    const ownerUser = new User({
      username: req.body.username,
      password: req.body.password,
      userType: 'owner',
      instituteId,
      email: req.body.email,
      fullName: req.body.ownerName
    });

    await ownerUser.save();

    res.status(201).json({
      message: 'Institute registered successfully',
      instituteId,
      instituteName: newInstitute.name
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// Verify institute exists
router.get('/verify/:instituteId', async (req, res) => {
  try {
    const institute = await Institute.findOne({ 
      instituteId: req.params.instituteId,
      isActive: true 
    });

    if (!institute) {
      return res.status(404).json({ exists: false, message: 'Institute not found' });
    }

    res.json({ 
      exists: true, 
      instituteName: institute.name,
      instituteType: institute.type
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: 'Verification failed' });
  }
});

module.exports = router;