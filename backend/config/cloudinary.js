require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
const api_key = process.env.CLOUDINARY_API_KEY;
const api_secret = process.env.CLOUDINARY_API_SECRET;

if (!cloud_name || !api_key || !api_secret) {
    console.warn("Cloudinary configuration missing! Please ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set in Vercel environment variables.");
}

cloudinary.config({
    cloud_name: cloud_name,
    api_key: api_key,
    api_secret: api_secret
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = {
    cloudinary,
    upload
};
