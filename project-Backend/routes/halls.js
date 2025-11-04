const express = require('express');
const router = express.Router();
const { auth, isOwner, isManager } = require('../Middleware/auth');
const Hall = require('../models/Hall');
const Floor = require('../models/Floor');
const Room = require('../models/Room');
const User = require('../models/User');

// Get all halls for an institute
router.get('/', auth, async (req, res) => {
  try {
    const halls = await Hall.find({ instituteId: req.user.instituteId })
      .populate('manager', 'fullName email phone')
      .sort('-createdAt');
    
    // Calculate additional stats for each hall
    const hallsWithStats = await Promise.all(halls.map(async (hall) => {
      const floors = await Floor.find({ hallId: hall._id });
      const rooms = await Room.find({ hallId: hall._id });
      
      return {
        ...hall.toObject(),
        totalFloors: floors.length,
        totalRooms: rooms.length,
        occupiedRooms: rooms.filter(r => r.status === 'occupied').length,
        availableRooms: rooms.filter(r => r.status === 'available').length
      };
    }));
    
    res.json(hallsWithStats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single hall details
router.get('/:hallId', auth, async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.hallId)
      .populate('manager', 'fullName email phone');
    
    if (!hall) {
      return res.status(404).json({ message: 'Hall not found' });
    }
    
    // Get additional statistics
    const floors = await Floor.find({ hallId: hall._id });
    const rooms = await Room.find({ hallId: hall._id });
    
    const hallDetails = {
      ...hall.toObject(),
      totalFloors: floors.length,
      totalRooms: rooms.length,
      occupiedRooms: rooms.filter(r => r.status === 'occupied').length,
      availableRooms: rooms.filter(r => r.status === 'available').length,
      maintenanceRooms: rooms.filter(r => r.status === 'maintenance').length
    };

    res.json(hallDetails);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new hall
router.post('/create', auth, isOwner, async (req, res) => {
  try {
    const hallData = {
      ...req.body,
      // Ensure correct field is stored for manager
      manager: req.body.managerId || null,
      instituteId: req.user.instituteId
    };

    const hall = new Hall(hallData);
    await hall.save();

    // If manager is assigned, update the manager's assigned halls
    if (req.body.managerId) {
      await User.findByIdAndUpdate(req.body.managerId, {
        $push: { assignedHalls: hall._id }
      });
    }

    const populatedHall = await Hall.findById(hall._id)
      .populate('manager', 'fullName email');

    res.status(201).json(populatedHall);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update hall
router.put('/:hallId', auth, isOwner, async (req, res) => {
  try {
    const hall = await Hall.findByIdAndUpdate(
      req.params.hallId,
      { $set: req.body },
      { new: true }
    ).populate('manager', 'fullName email');

    if (!hall) {
      return res.status(404).json({ message: 'Hall not found' });
    }

    res.json(hall);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete hall
router.delete('/:hallId', auth, isOwner, async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.hallId);
    
    if (!hall) {
      return res.status(404).json({ message: 'Hall not found' });
    }

    // Remove hall from manager's assigned halls
    if (hall.manager) {
      await User.findByIdAndUpdate(hall.manager, {
        $pull: { assignedHalls: hall._id }
      });
    }

    // Delete all associated floors and rooms
    await Floor.deleteMany({ hallId: hall._id });
    await Room.deleteMany({ hallId: hall._id });
    
    await hall.remove();

    res.json({ message: 'Hall deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Assign/Update manager
router.put('/:hallId/assign-manager', auth, isOwner, async (req, res) => {
  try {
    const { managerId } = req.body;
    const hall = await Hall.findById(req.params.hallId);

    if (!hall) {
      return res.status(404).json({ message: 'Hall not found' });
    }

    // Remove hall from previous manager if exists
    if (hall.manager) {
      await User.findByIdAndUpdate(hall.manager, {
        $pull: { assignedHalls: hall._id }
      });
    }

    // Assign to new manager
    hall.manager = managerId || null;
    await hall.save();

    // Add hall to new manager
    if (managerId) {
      await User.findByIdAndUpdate(managerId, {
        $push: { assignedHalls: hall._id }
      });
    }

    const updatedHall = await Hall.findById(hall._id)
      .populate('manager', 'fullName email phone');

    res.json(updatedHall);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get floors for a hall
router.get('/:hallId/floors', auth, async (req, res) => {
  try {
    const floors = await Floor.find({ hallId: req.params.hallId })
      .sort('floorNumber');
    
    // Add room statistics to each floor
    const floorsWithStats = await Promise.all(floors.map(async (floor) => {
      const rooms = await Room.find({ floorId: floor._id });
      
      return {
        ...floor.toObject(),
        totalRooms: rooms.length,
        occupiedRooms: rooms.filter(r => r.status === 'occupied').length,
        availableRooms: rooms.filter(r => r.status === 'available').length
      };
    }));
    
    res.json(floorsWithStats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create floor (OLD METHOD - with room types)
router.post('/:hallId/floors/create', auth, isOwner, async (req, res) => {
  try {
    const floorData = {
      ...req.body,
      hallId: req.params.hallId
    };

    const floor = new Floor(floorData);
    await floor.save();

    // Update hall statistics
    await Hall.findByIdAndUpdate(req.params.hallId, {
      $inc: { 
        totalFloors: 1,
        totalRooms: floor.totalRooms
      }
    });

    // Create rooms for the floor
    const rooms = [];
    let roomCounter = 1;

    // Create rooms based on room types
    for (const [type, count] of Object.entries(floor.roomsPerType)) {
      for (let i = 0; i < count; i++) {
        const roomNumber = `${floor.floorNumber}${String(roomCounter).padStart(2, '0')}`;
        const capacity = type === 'single' ? 1 : type === 'double' ? 2 : type === 'triple' ? 3 : 4;
        
        rooms.push({
          floorId: floor._id,
          hallId: req.params.hallId,
          roomNumber,
          type,
          capacity,
          pricePerBed: req.body.pricePerBed || 5000,
          facilities: req.body.roomFacilities || []
        });
        
        roomCounter++;
      }
    }

    if (rooms.length > 0) {
      await Room.insertMany(rooms);
    }

    res.status(201).json(floor);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create floor with details (NEW METHOD - creates empty rooms)
router.post('/:hallId/floors/create-with-details', auth, isOwner, async (req, res) => {
  try {
    const { floorNumber, name, description, facilities, totalRooms } = req.body;
    
    // Create floor
    const floor = new Floor({
      hallId: req.params.hallId,
      floorNumber,
      name,
      description,
      facilities,
      totalRooms
    });

    await floor.save();

    // Create empty rooms
    const rooms = [];
    for (let i = 1; i <= totalRooms; i++) {
      const roomNumber = `${floorNumber}${String(i).padStart(2, '0')}`;
      rooms.push({
        floorId: floor._id,
        hallId: req.params.hallId,
        roomNumber,
        type: 'double', // default type
        capacity: 2, // default capacity
        pricePerBed: 5000, // default price
        status: 'available'
      });
    }

    await Room.insertMany(rooms);

    // Update hall statistics
    await Hall.findByIdAndUpdate(req.params.hallId, {
      $inc: { 
        totalFloors: 1,
        totalRooms: totalRooms,
        availableRooms: totalRooms
      }
    });

    res.status(201).json({
      message: 'Floor created successfully',
      floor,
      roomsCreated: rooms.length
    });

  } catch (error) {
    console.error('Error creating floor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;