const express = require('express');
const router = express.Router();
const { auth, isOwner, isManager } = require('../Middleware/auth');
const Room = require('../models/Room');
const Floor = require('../models/Floor');
const Hall = require('../models/Hall');

// Get room details
router.get('/:roomId', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId)
      .populate('occupants', 'fullName email phone')
      .populate('floorId', 'name floorNumber')
      .populate('hallId', 'name');
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update room
router.put('/:roomId', auth, isManager, async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.roomId,
      { $set: req.body },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update room status
router.patch('/:roomId/status', auth, isManager, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['available', 'occupied', 'maintenance', 'reserved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const room = await Room.findByIdAndUpdate(
      req.params.roomId,
      { status },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add occupant to room
router.post('/:roomId/occupants', auth, isManager, async (req, res) => {
  try {
    const { studentId } = req.body;
    const room = await Room.findById(req.params.roomId);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    if (room.currentOccupancy >= room.capacity) {
      return res.status(400).json({ message: 'Room is full' });
    }
    
    room.occupants.push(studentId);
    room.currentOccupancy = room.occupants.length;
    
    await room.save();
    
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove occupant from room
router.delete('/:roomId/occupants/:studentId', auth, isManager, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    room.occupants = room.occupants.filter(
      occupant => occupant.toString() !== req.params.studentId
    );
    room.currentOccupancy = room.occupants.length;
    
    await room.save();
    
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;