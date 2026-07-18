const Order = require('../models/Order');

// @desc    Create a new order
// @route   POST /api/orders
const createOrder = async (req, res) => {
    try {
        const { customerName, phoneNumber, address, cartItems, totalPrice } = req.body;

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: 'No order items' });
        }

        const order = new Order({
            customerName,
            phoneNumber,
            address,
            cartItems,
            totalPrice
        });

        const createdOrder = await order.save();
        res.status(201).json(createdOrder);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

// @desc    Get all orders
// @route   GET /api/orders
const getOrders = async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

module.exports = {
    createOrder,
    getOrders
};
