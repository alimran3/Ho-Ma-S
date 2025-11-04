const mongoose = require('mongoose');

const mealSelectionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  hallId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hall', required: true },
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true },
  date: { type: Date, required: true }, // normalized to 00:00
  breakfast: { type: Boolean, default: false },
  lunch: { type: Boolean, default: false },
  dinner: { type: Boolean, default: false },
  prices: {
    breakfast: { type: Number, default: 0 },
    lunch: { type: Number, default: 0 },
    dinner: { type: Number, default: 0 },
  }
}, { timestamps: true });

mealSelectionSchema.index({ studentId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('MealSelection', mealSelectionSchema);
