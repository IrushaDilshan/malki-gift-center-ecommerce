const Feedback = require('../models/Feedback');

const getFeedback = async (req, res) => {
    try {
        const feedbackList = await Feedback.find().sort({ createdAt: -1 });
        res.status(200).json(feedbackList);
    } catch (error) {
        console.error("Error fetching feedback:", error);
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

const replyFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const { reply } = req.body;

        if (reply === undefined) return res.status(400).json({ message: "Reply is required" });

        const updatedFeedback = await Feedback.findByIdAndUpdate(
            id,
            { reply },
            { new: true }
        );

        if (!updatedFeedback) return res.status(404).json({ message: "Feedback not found" });

        res.status(200).json(updatedFeedback);
    } catch (error) {
        console.error("Error replying to feedback:", error);
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

module.exports = {
    getFeedback,
    replyFeedback
};
