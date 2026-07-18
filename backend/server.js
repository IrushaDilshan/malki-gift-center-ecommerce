const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const settingRoutes = require('./routes/settingRoutes');
const adminRoutes = require('./routes/adminRoutes');

dotenv.config();

// 2. DB එකට connect කරන්න
connectDB();

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json()); // JSON data handle කරන්න

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/admin', adminRoutes);

// Simple Test Route
app.get('/', (req, res) => {
    res.send('Malki Gift Center Backend Running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;