//Written by Karl Pollock, 2022.
//KarlPollock91@gmail.com
//www.karlpollock.com

//fileUpload.js contains functons related to uploading files to the database using GridFS.

const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const {GridFsStorage} = require('multer-gridfs-storage');
const db = require("../db/connection.js").get();

const storage = new GridFsStorage({
    db: db,
    options: { useUnifiedTopology: true},
    file: (req, file) => {
        const buf = crypto.randomBytes(16); 
        const filename = buf.toString('hex') + path.extname(file.originalname);
        if (file.mimetype.split('/')[0] === "image") {
            return {bucketName: file.mimetype.split('/')[0],
                filename: filename,
            };
        } else {
            return null;
        }
    }
});

module.exports = multer({storage}).single('file-upload');