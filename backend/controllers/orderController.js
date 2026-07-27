const Order = require('../models/Order');

const createOrder = async (req, res) => {
    try {
        const { customerName, phone, address, items, totalAmount, deliveryFee } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'No order items' });
        }

        const order = new Order({
            customerName,
            phone,
            address,
            items,
            totalAmount,
            deliveryFee: deliveryFee || 0
        });

        const createdOrder = await order.save();
        return res.status(201).json(createdOrder);
    } catch (error) {
        console.error('Error creating order:', error);
        return res.status(500).json({ message: error.message || 'Server Error' });
    }
};

const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ createdAt: -1 });
        return res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        return res.status(500).json({ message: error.message || 'Server Error' });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        return res.status(200).json(updatedOrder);
    } catch (error) {
        console.error('Error updating order status:', error);
        return res.status(500).json({ message: error.message || 'Server Error' });
    }
};

module.exports = {
    createOrder,
    getAllOrders,
    updateOrderStatus
};
