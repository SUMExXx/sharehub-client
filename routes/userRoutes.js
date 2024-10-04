const express = require('express');
const multer = require('multer');
const { uploadImage } = require('../controllers/userController');

const router = express.Router();
const upload = multer({ dest: '../storage/' }); // Temporary folder for uploaded files

router.post('/upload', upload.single('image'), uploadImage);

module.exports = router;