//Written by Karl Pollock, 2022.
//KarlPollock91@gmail.com
//www.karlpollock.com

//filesRoute.js routes for /files/ and contains all routing related to files

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const PostModel = require("../db/models/postModel");

const verifyAuth = require("../middleware/verifyAuth");

//Download single image.
router.get('/image/:id', (req, res) => {
    try{
        bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {bucketName: process.env.BUCKET_IMAGES});
        bucket.openDownloadStream(mongoose.Types.ObjectId(req.params.id)).pipe(res);
    } catch {
        res.status(404);
    }
});

router.get('/getImageFromPost/:imageId', verifyAuth, (req, res) => {
    PostModel().findById(req.params.imageId).then((post) => {
        if (post.dataType === "image") {
            res.status(200).json({dataId:post.dataId});
        } else {
            res.sendStatus(415);
        }
    }).catch((err) => {
        res.sendStatus(404);
    });
})

module.exports = router;
