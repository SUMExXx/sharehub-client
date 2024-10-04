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
    
        const targetUrl = `https://${process.env.API_BASE_URL}/users/upload`;
    
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