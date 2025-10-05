// controllers/floorController.js
const Floor = require('../models/Floor');

exports.createFloor = async (req, res) => {
  try {
    const { hallId, name, description } = req.body;
    const floor = new Floor({
      hall: hallId,
      name,
      description,
    });
    await floor.save();
    res.status(201).json(floor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFloors = async (req, res) => {
  try {
    const { hallId } = req.params;
    const floors = await Floor.find({ hall: hallId });
    res.json(floors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
