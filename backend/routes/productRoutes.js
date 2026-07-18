const express = require('express');
const {
    addProduct,
    getProducts,
    deleteProduct,
} = require('../controllers/productController');

const router = express.Router();

router.post('/', addProduct);
router.get('/', getProducts);
router.delete('/:id', deleteProduct);

module.exports = router;