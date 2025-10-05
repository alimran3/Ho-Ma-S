// controllers/hallController.js
const Hall = require('../models/Hall');

exports.createHall = async (req, res) => {
  try {
    const { name, description } = req.body;
    const hall = new Hall({
      institution: req.user.id,
      name,
      description,
    });
    await hall.save();
    res.status(201).json(hall);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getHalls = async (req, res) => {
  try {
    const halls = await Hall.find({ institution: req.user.id });
    res.json(halls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
