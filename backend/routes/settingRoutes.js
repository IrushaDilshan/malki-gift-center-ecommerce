const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingController');

router.get('/', getSettings);
router.put('/', updateSettings);
// Allow POST to do the same for flexibility
router.post('/', updateSettings);

module.exports = router;
