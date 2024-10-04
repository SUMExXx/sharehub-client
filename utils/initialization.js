const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const rootDir = path.join(__dirname, '../root');
const folderNames = ['folder1', 'folder2', 'folder3'];

function ensureFoldersExist(folderNames, rootDir) {
    folderNames.forEach(folderName => {
        const folderPath = path.join(rootDir, folderName);
        
        // Check if the folder exists
        fs.access(folderPath, fs.constants.F_OK, (err) => {
            if (err) {
                // Folder does not exist, create it
                fs.mkdir(folderPath, { recursive: true }, (err) => {
                    if (err) {
                        console.error(`Error creating folder ${folderName}:`, err);
                    } else {
                        console.log(`Created folder: ${folderName}`);
                    }
                });
            } else {
                console.log(`Folder already exists: ${folderName}`);
            }
        });
    });
}

module.exports.initRoot = async (uid) => {

    const body = {
        user_id: "b9336fa6-bdd2-453b-8682-6745da8ef7ac"
    }

    axios.post(`https://${process.env.API_BASE_URL}/users/getGroups`, body).then(response => {
        // Ensure the root directory exists before checking for folders
        fs.mkdir(rootDir, { recursive: true }, (err) => {
            if (err) {
                console.error('Error creating root directory:', err);
            } else {
                ensureFoldersExist(response.data.groups, rootDir);
            }
        });
    })
}