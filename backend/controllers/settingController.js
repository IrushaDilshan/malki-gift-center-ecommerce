const Setting = require('../models/Setting');

const getSettings = async (req, res) => {
    try {
        // Fetch the first document since we only have one global settings doc
        let settings = await Setting.findOne();
        
        // If it doesn't exist, create an empty one
        if (!settings) {
            settings = await Setting.create({});
        }

        res.status(200).json(settings);
    } catch (error) {
        console.error("Error fetching settings:", error);
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

const updateSettings = async (req, res) => {
    try {
        const { phone, email, address, deliveryCharge } = req.body;
        
        let settings = await Setting.findOne();
        
        if (!settings) {
            settings = await Setting.create({ phone, email, address, deliveryCharge });
        } else {
            settings.phone = phone !== undefined ? phone : settings.phone;
            settings.email = email !== undefined ? email : settings.email;
            settings.address = address !== undefined ? address : settings.address;
            settings.deliveryCharge = deliveryCharge !== undefined ? deliveryCharge : settings.deliveryCharge;
            await settings.save();
        }

        res.status(200).json(settings);
    } catch (error) {
        console.error("Error updating settings:", error);
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

module.exports = {
    getSettings,
    updateSettings
};
