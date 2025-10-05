const express = require('express');
const router = express.Router();
const { auth, isOwner, isManager } = require('../Middleware/auth');
const Floor = require('../models/Floor');
const Room = require('../models/Room');
const Hall = require('../models/Hall');

// Get floor details
router.get('/:floorId', auth, async (req, res) => {
  try {
    const floor = await Floor.findById(req.params.floorId)
      .populate('hallId', 'name');
    
    if (!floor) {
      return res.status(404).json({ message: 'Floor not found' });
    }
    
    const rooms = await Room.find({ floorId: floor._id });
    
    const floorDetails = {
      ...floor.toObject(),
      totalRooms: rooms.length,
      occupiedRooms: rooms.filter(r => r.status === 'occupied').length,
      availableRooms: rooms.filter(r => r.status === 'available').length,
      maintenanceRooms: rooms.filter(r => r.status === 'maintenance').length
    };

    res.json(floorDetails);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get rooms for a floor
router.get('/:floorId/rooms', auth, async (req, res) => {
  try {
    const rooms = await Room.find({ floorId: req.params.floorId })
      .populate('occupants', 'fullName email')
      .sort('roomNumber');
    
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update floor
router.put('/:floorId', auth, isOwner, async (req, res) => {
  try {
    const floor = await Floor.findByIdAndUpdate(
      req.params.floorId,
      { $set: req.body },
      { new: true }
    );

    if (!floor) {
      return res.status(404).json({ message: 'Floor not found' });
    }

    res.json(floor);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete floor
router.delete('/:floorId', auth, isOwner, async (req, res) => {
  try {
    const floor = await Floor.findById(req.params.floorId);
    
    if (!floor) {
      return res.status(404).json({ message: 'Floor not found' });
    }

    // Delete all rooms on this floor
    await Room.deleteMany({ floorId: floor._id });
    
    // Update hall statistics
    await Hall.findByIdAndUpdate(floor.hallId, {
      $inc: { 
        totalFloors: -1,
        totalRooms: -floor.totalRooms
      }
    });
    
    await floor.remove();

    res.json({ message: 'Floor deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;