const mongoose = require('mongoose');

const hallSchema = new mongoose.Schema({
  instituteId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['boys', 'girls', 'mixed'],
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  facilities: [{
    type: String
  }],
  description: {
    type: String
  },
  totalFloors: {
    type: Number,
    default: 0
  },
  totalRooms: {
    type: Number,
    default: 0
  },
  occupiedRooms: {
    type: Number,
    default: 0
  },
  availableRooms: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

hallSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.availableRooms = this.totalRooms - this.occupiedRooms;
  next();
});

module.exports = mongoose.model('Hall', hallSchema);