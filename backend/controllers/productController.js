const Product = require('../models/Product');

const addProduct = async (req, res) => {
    try {
        const { title, description, price, image, category, stock } = req.body;

        const product = await Product.create({
            title,
            description,
            price,
            image,
            category,
            stock,
        });

        return res.status(201).json(product);
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });

        return res.status(200).json(products);
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedProduct = await Product.findByIdAndDelete(id);

        if (!deletedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        return res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    addProduct,
    getProducts,
    deleteProduct,
};