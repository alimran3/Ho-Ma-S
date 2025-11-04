const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  image: { type: String },
  description: { type: String }
}, { _id: false });

const dailyMenuSchema = new mongoose.Schema({
  instituteId: { type: String, required: true },
  hallId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hall', required: true },
  date: { type: Date, required: true }, // normalized to 00:00
  meals: {
    breakfast: { type: [menuItemSchema], default: [] },
    lunch: { type: [menuItemSchema], default: [] },
    dinner: { type: [menuItemSchema], default: [] }
  },
  mealPrices: {
    breakfast: { type: Number, default: 0 },
    lunch: { type: Number, default: 0 },
    dinner: { type: Number, default: 0 }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

dailyMenuSchema.index({ hallId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyMenu', dailyMenuSchema);
