const express = require('express');
const multer = require('multer');
const { uploadImage, getGroupImages, getImage, sendImage } = require('../controllers/userController');

const router = express.Router();
const upload = multer({ dest: '../storage/' }); // Temporary folder for uploaded files

router.post('/upload', upload.single('image'), uploadImage);

router.post('/getGroupImages', getGroupImages);

router.post('/getImage', getImage);

router.post('/sendImage', sendImage);

module.exports = router;