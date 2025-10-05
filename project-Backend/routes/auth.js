const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Institute = require('../models/Institute');
const { auth } = require('../Middleware/auth'); // import auth middleware

// JWT Secret from environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// ---------------- LOGIN ----------------
router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('instituteId').notEmpty().withMessage('Institute ID is required'),
  body('userType').isIn(['owner', 'manager', 'student', 'guest']).withMessage('Invalid user type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, password, instituteId, userType } = req.body;

    // Verify institute exists
    const institute = await Institute.findOne({ instituteId });
    if (!institute) return res.status(404).json({ message: 'Institute not found' });

    // Find user
    const user = await User.findOne({ username, instituteId, userType, isActive: true });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Invalid credentials' });

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign({
      userId: user._id,
      username: user.username,
      userType: user.userType,
      instituteId: user.instituteId
    }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        userType: user.userType,
        instituteId: user.instituteId,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// ---------------- VERIFY TOKEN ----------------
router.get('/verify', auth, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// ---------------- REFRESH TOKEN ----------------
router.post('/refresh', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || !user.isActive) return res.status(401).json({ message: 'User not found or inactive' });

    const newToken = jwt.sign({
      userId: user._id,
      username: user.username,
      userType: user.userType,
      instituteId: user.instituteId
    }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ success: true, token: newToken });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ message: 'Failed to refresh token' });
  }
});

// ---------------- CHANGE PASSWORD ----------------
router.post('/change-password', auth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) return res.status(401).json({ message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

// ---------------- FORGOT PASSWORD ----------------
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('instituteId').notEmpty().withMessage('Institute ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, instituteId } = req.body;
    const user = await User.findOne({ email, instituteId });
    if (!user) return res.json({ message: 'If the email exists, a reset link has been sent' });

    const resetToken = jwt.sign({ userId: user._id, purpose: 'password-reset' }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ message: 'Password reset token generated', resetToken }); // Remove resetToken in production
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to process request' });
  }
});
// Guest login route (add this to existing auth.js)
router.post('/guest-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check for guest credentials
    if (username === 'guest' && password === 'pass') {
      // Generate token for guest
      const token = jwt.sign(
        {
          userId: 'guest-user',
          username: 'guest',
          userType: 'guest',
          instituteId: 'all'
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        token,
        user: {
          id: 'guest-user',
          username: 'guest',
          fullName: 'Guest User',
          userType: 'guest',
          instituteId: 'all'
        }
      });
    } else {
      res.status(401).json({ message: 'Invalid guest credentials' });
    }
  } catch (error) {
    console.error('Guest login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// ---------------- RESET PASSWORD ----------------
router.post('/reset-password', [
  body('resetToken').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { resetToken, newPassword } = req.body;
    const decoded = jwt.verify(resetToken, JWT_SECRET);
    if (decoded.purpose !== 'password-reset') return res.status(400).json({ message: 'Invalid reset token' });

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    if (error.name === 'TokenExpiredError') return res.status(400).json({ message: 'Reset token has expired' });
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

// ---------------- USER INFO ----------------
router.get('/user-info', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password')
      .populate('assignedHalls', 'name');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ message: 'Failed to fetch user info' });
  }
});

// ---------------- LOGOUT ----------------
router.post('/logout', auth, async (req, res) => {
  try {
    // optional: server-side token blacklist
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
});

module.exports = router;
