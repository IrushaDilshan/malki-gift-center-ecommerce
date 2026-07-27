const Product = require('../models/Product');
const { cloudinary } = require('../config/cloudinary');

const streamUpload = (file) => {
    return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream(
            { folder: "malki_gifts" },
            (error, result) => {
                if (result) resolve(result);
                else reject(error);
            }
        );
        stream.end(file.buffer);
    });
};

const addProduct = async (req, res) => {
    try {
        const { title, description, price, category, stock } = req.body;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "At least one image file is required" });
        }

        const imageUrls = [];
        for (const file of req.files) {
            const result = await streamUpload(file);
            imageUrls.push(result.secure_url);
        }

        const product = await Product.create({
            title,
            description,
            price,
            images: imageUrls,
            category,
            stock,
        });

        return res.status(201).json(product);
    } catch (error) {
        console.error("Error adding product:", error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, price, category, stock } = req.body;
        
        let updateData = { title, description, price, category, stock };

        if (req.files && req.files.length > 0) {
            const imageUrls = [];
            for (const file of req.files) {
                const result = await streamUpload(file);
                imageUrls.push(result.secure_url);
            }
            updateData.images = imageUrls;
        } else if (req.body.images) {
            updateData.images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
        }

        const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        return res.status(200).json(updatedProduct);
    } catch (error) {
        console.error("Error updating product:", error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        return res.status(200).json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
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
        console.error("Error deleting product:", error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const addProductReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { customerName, rating, comment } = req.body;
        
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const review = {
            customerName,
            rating: Number(rating),
            comment
        };

        product.reviews.push(review);
        await product.save();

        return res.status(200).json(product);
    } catch (error) {
        console.error("Error adding product review:", error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getAllProductReviews = async (req, res) => {
    try {
        const products = await Product.find({});
        let allReviews = [];
        
        products.forEach(product => {
            if (product.reviews && product.reviews.length > 0) {
                product.reviews.forEach(review => {
                    allReviews.push({
                        _id: review._id,
                        customerName: review.customerName,
                        rating: review.rating,
                        comment: review.comment,
                        createdAt: review.createdAt,
                        productTitle: product.title,
                        productId: product._id
                    });
                });
            }
        });
        
        // Sort by latest first
        allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        return res.status(200).json(allReviews);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    addProduct,
    getProducts,
    deleteProduct,
    updateProduct,
    addProductReview,
    getAllProductReviews,
};