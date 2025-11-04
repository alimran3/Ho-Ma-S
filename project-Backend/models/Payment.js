const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'BDT' },
    status: { type: String, enum: ['pending', 'success', 'failed', 'cancelled'], default: 'pending' },
    tran_id: { type: String, required: true, unique: true },
    val_id: { type: String },
    sessionKey: { type: String },
    gatewayResponse: { type: Object },
    receivedByManager: { type: Boolean, default: false },
    receivedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
