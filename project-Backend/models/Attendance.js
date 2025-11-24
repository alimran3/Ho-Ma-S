const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  isPresent: {
    type: Boolean,
    default: false
  },
  checkIn: {
    type: String, // Time of check-in (e.g., "08:30 AM")
    default: null
  },
  checkOut: {
    type: String, // Time of check-out (e.g., "06:00 PM")
    default: null
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  remarks: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for faster queries
attendanceSchema.index({ studentId: 1, date: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
