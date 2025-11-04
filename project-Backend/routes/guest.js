const express = require('express');
const router = express.Router();
const Hall = require('../models/Hall');
const Floor = require('../models/Floor');
const Room = require('../models/Room');

// Get halls for a specific institute (public info only)
router.get('/halls', async (req, res) => {
  try {
    const { instituteId } = req.query;

    if (!instituteId) {
      return res.status(400).json({ message: 'instituteId is required' });
    }

    const halls = await Hall.find({ isActive: true, instituteId })
      .select('name type location capacity facilities totalRooms occupiedRooms availableRooms');

    res.json(halls);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get floors for a hall
router.get('/halls/:hallId/floors', async (req, res) => {
  try {
    const floors = await Floor.find({ 
      hallId: req.params.hallId,
      isActive: true 
    })
    .select('name floorNumber totalRooms occupiedRooms');

    const floorsWithAvailability = floors.map(floor => ({
      ...floor.toObject(),
      availableRooms: floor.totalRooms - (floor.occupiedRooms || 0)
    }));

    res.json(floorsWithAvailability);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get rooms for a floor (no personal info)
router.get('/floors/:floorId/rooms', async (req, res) => {
  try {
    const rooms = await Room.find({ 
      floorId: req.params.floorId,
      isActive: true 
    })
    .select('roomNumber type capacity currentOccupancy status pricePerBed facilities');

    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;