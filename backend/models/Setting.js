const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    deliveryCharge: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
