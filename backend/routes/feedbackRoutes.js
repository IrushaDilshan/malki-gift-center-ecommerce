const express = require('express');
const router = express.Router();
const { getFeedback, replyFeedback } = require('../controllers/feedbackController');

router.get('/', getFeedback);
router.put('/:id/reply', replyFeedback);

module.exports = router;
