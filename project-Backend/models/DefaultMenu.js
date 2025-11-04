const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  image: { type: String },
  description: { type: String }
}, { _id: false });

const defaultMenuSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true },
  hallId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hall', required: true },
  meals: {
    breakfast: { type: [menuItemSchema], default: [] },
    lunch: { type: [menuItemSchema], default: [] },
    dinner: { type: [menuItemSchema], default: [] }
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

defaultMenuSchema.index({ hallId: 1 }, { unique: true });

module.exports = mongoose.model('DefaultMenu', defaultMenuSchema);
