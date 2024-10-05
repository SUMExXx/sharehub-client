const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const FormData = require('form-data');

const userData = require('../data/userData.json');

module.exports.uploadImage = async (req, res) => {

    const gid = req.body.group_id;
    //const uid = req.body.user_id;
    const uid = userData.user.user_id;
    var name = "";
    var extension = "";
    var size = 0;

    try {
        const file = req.file;
    
        if (!file) {
          return res.status(400).send('No file uploaded.');
        }

        name = path.basename(file.originalname, path.extname(file.originalname));;
        extension = path.extname(file.originalname).slice(1);
        size = file.size;
    
        const targetUrl = `${process.env.API_BASE_URL}/users/upload`;
    
        const formData = new FormData();
        formData.append('image', fs.createReadStream(file.path), file.originalname);
        formData.append('name', name); 
        formData.append('extension', extension);
        formData.append('size', size); 
        formData.append('user_id', uid); 
        formData.append('group_id', gid); 
    
        await axios.post(targetUrl, formData, {
          headers: formData.getHeaders(),
        }).then( async (response) => {

            if(response.status == 201){
                const targetPath = path.join(__dirname, `../root/${gid}`, file.originalname);
    
                fs.copyFile(file.path, targetPath, () => {
                    fs.unlink(file.path, () => {
                        res.status(201).send({
                            message: 'Image uploaded and copied successfully',
                        });
                    });
                });
            
            }else{
                res.status(500).send('Upload failed');
            }
        })
    
    } catch (error) {
        console.error('Error during upload:', error);
        res.status(500).send('An error occurred during file upload.');
    }
}

module.exports.getGroupImages = async (req, res) => {

    const gid = req.body.group_id;
    //const uid = req.body.user_id;
    const uid = userData.user.user_id;

    try {
    
        const targetUrl = `${process.env.API_BASE_URL}/users/getThumbnails`;
    
        const data = {
            'group_id': gid
        }
    
        await axios.post(targetUrl, data).then( async (response) => {

            if(response.status == 200){

                var imagesData = response.data.thumbnails;

                imagesData.forEach((element, index) => {
                    console.log(path.join(__dirname, `../root/${gid}`, `${element.name}.${element.extension}`))
                    if(fs.existsSync(path.join(__dirname, `../root/${gid}`, `${element.name}.${element.extension}`))){
                        imagesData[index].saved = true;
                    }else{
                        imagesData[index].saved = false;
                    }
                });
                res.status(200).send({
                    images: imagesData
                });
            
            }else{
                res.status(500).send('Failed to fetch images from group');
            }
        })
    
    } catch (error) {
        // console.error('Error:', error);
        res.status(500).send('An error occured in fetching');
    }
}

module.exports.sendImage = async (req, res) => {

    const gid = req.body.group_id;
    const name = req.body.name;
    const extension = req.body.extension;

    try {
        const imagePath = path.join(__dirname, `../root/${gid}`, `${name}.${extension}`);

        if (!fs.existsSync(imagePath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        const imageBuffer = fs.readFileSync(imagePath);

        const base64Image = imageBuffer.toString('base64');

        const responseData = {
            group_id: gid,
            name: name,
            size: fs.statSync(imagePath).size,
            extension: extension,
            image: `data:image/${extension};base64,${base64Image}`, // Send image as base64 data URI
            message: 'Image sent successfully',
        };

        res.status(200).json(responseData);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while sending the image' });
    }

}

module.exports.getImage = async (req, res) => {

    const gid = req.body.group_id;
    const imgId = req.body.image_id;
    //const uid = req.body.user_id;
    const uid = userData.user.user_id;

    var imageDetails;

    try{

        const imageDetailsURL = `${process.env.API_BASE_URL}/users/getImageDetails`

        const imageDetailsData = {
            'user_id': uid,
            'group_id': gid,
            'image_id': imgId
        }

        await axios.post(imageDetailsURL, imageDetailsData).then( async (response) => {
            if(response.status == 200){

                imageDetails = response.data;
            
            }else{
                res.status(400).send('Image details not valid');
            }
        })

    } catch (error){
        return res.status(400).send('Failed to fetch image details');
    }

    try {
    
        const targetUrl = `${process.env.API_BASE_URL}/users/getImage`;
    
        const data = {
            'group_id': gid,
            'image_id': imgId
        }
    
        await axios.post(targetUrl, data, {
            responseType: 'arraybuffer', // Important to specify that we expect binary data
        }).then( async (response) => {

            if(response.status == 200){

                const responseData = response.data; // This will be the binary image data
                const jsonResponse = response.headers['content-type'].includes('application/json') ? JSON.parse(responseData) : null;

                // Extract the image data (assuming it’s in base64 format)
                const imageBase64 = jsonResponse.image;

                if(jsonResponse == null){
                    return res.status(500).send('No JSON data received');
                }

                if(jsonResponse.id == imageDetails.id && jsonResponse.name == imageDetails.name && jsonResponse.size == imageDetails.size && jsonResponse.owner == imageDetails.owner && jsonResponse.extension == imageDetails.extension){
                    if(fs.existsSync(path.join(__dirname, `../root/${gid}`, `${jsonResponse.name}.${jsonResponse.extension}`))){
                        return res.status(400).send('Image already exists')
                    }else{
                        const imageBuffer = Buffer.from(imageBase64, 'base64');
                        fs.writeFileSync(path.join(__dirname, `../root/${gid}`, `${jsonResponse.name}.${jsonResponse.extension}`), imageBuffer);

                        try{

                            const ackowledgementUrl = `${process.env.API_BASE_URL}/users/imageReceivedAcknowledgement`;
    
                            const data = {
                                'user_id': uid,
                                'group_id': gid,
                                'image_id': imgId
                            }

                            await axios.post(ackowledgementUrl, data).then( async (response) => {
                                if(response.status == 200){
                                    console.log(`Saved new image ${jsonResponse.name}.${jsonResponse.extension}`);
                                } else{
                                    fs.unlinkSync(path.join(__dirname, `../root/${gid}`, `${jsonResponse.name}.${jsonResponse.extension}`));
                                    return res.status(500).send('Ackowledgement failed');
                                }
                            })

                        } catch (error){
                            fs.unlinkSync(path.join(__dirname, `../root/${gid}`, `${jsonResponse.name}.${jsonResponse.extension}`));
                            return res.status(500).send('Ackowledgement failed');
                        }
                    }
                } else {
                    return res.status(400).send('Image details don\'t match');
                }
            
            }else{
                res.status(500).send('Failed to fetch images from group');
            }
        })
    
    } catch (error) {
        // console.error('Error:', error);
        res.status(500).send('An error occured in fetching');
    }
}