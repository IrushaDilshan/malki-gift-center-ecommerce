const express = require('express');
const {
    addProduct,
    getProducts,
    deleteProduct,
    updateProduct,
    addProductReview,
    getAllProductReviews,
} = require('../controllers/productController');
const { upload } = require('../config/cloudinary');

const router = express.Router();

router.get('/reviews/all', getAllProductReviews);
router.post('/', upload.array('images', 5), addProduct);
router.get('/', getProducts);
router.put('/:id', upload.array('images', 5), updateProduct);
router.delete('/:id', deleteProduct);
router.post('/:id/reviews', addProductReview);

module.exports = router;