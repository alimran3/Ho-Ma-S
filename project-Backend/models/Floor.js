const mongoose = require('mongoose');

const floorSchema = new mongoose.Schema({
  hallId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hall',
    required: true
  },
  floorNumber: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  totalRooms: {
    type: Number,
    required: true
  },
  roomsPerType: {
    single: { type: Number, default: 0 },
    double: { type: Number, default: 0 },
    triple: { type: Number, default: 0 },
    dormitory: { type: Number, default: 0 }
  },
  facilities: [{
    type: String
  }],
  occupiedRooms: {
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
  }
});

module.exports = mongoose.model('Floor', floorSchema);