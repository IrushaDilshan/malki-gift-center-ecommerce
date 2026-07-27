const Category = require('../models/Category');

const getCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        res.status(200).json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

const addCategory = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: "Category name is required" });

        const category = await Category.create({ name });
        res.status(201).json(category);
    } catch (error) {
        console.error("Error adding category:", error);
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCategory = await Category.findByIdAndDelete(id);
        
        if (!deletedCategory) return res.status(404).json({ message: "Category not found" });
        
        res.status(200).json({ message: "Category deleted" });
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

module.exports = {
    getCategories,
    addCategory,
    deleteCategory
};
