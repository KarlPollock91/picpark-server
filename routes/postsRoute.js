//Written by Karl Pollock, 2022.
//KarlPollock91@gmail.com
//www.karlpollock.com

//postsRoute.js routes for /posts/ and contains all routing related to posts

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const fileUpload = require("../middleware/fileUpload");

const PostModel = require("../db/models/postModel");
const CommentModel = require("../db/models/commentModel")
const ServerModel = require("../db/models/serversModel");

const verifyAuth = require("../middleware/verifyAuth");
const serverPermissions = require("../middleware/serverPermissions");

//Make comment
router.post('/makeComment/:serverId/:postId', verifyAuth, serverPermissions, fileUpload, (req, res) => {
    const comment = new CommentModel()({
        authorId: req.userId,
        serverId: req.params.serverId,
        postId: req.params.postId,
        commentText: req.body.commentText,
        date: Date.now()
    });
    comment.save().then((savedComment) => {
        res.status(200).json(savedComment);
    })
})

//Post new file to the server
router.post('/upload/:serverId', verifyAuth, serverPermissions, fileUpload, (req, res) => {
    if (req.file != null && req.file.mimetype.split('/')[0] === "image") {
        const post = new PostModel()({
            dataId: req.file.id,
            authorId: req.userId,
            postText: req.body.postText,
            serverId: req.params.serverId,
            dataType: "image",
            date: Date.now()
        })
        post.save().then((savedImage) => {
            res.status(200).json({dataId: savedImage.dataId});
        })
    } else {
        res.sendStatus(422);
    }
});

//Gets the comments on a post on a server
router.get('/getComments/:serverId/:postId', verifyAuth, serverPermissions, (req, res) => {
    CommentModel().find({serverId: req.params.serverId, postId: req.params.postId}).sort({date: -1}).then((comments) => {
        res.status(200).json(comments);
    }).catch((err) => {
        res.sendStatus(400);
    })

})

//Delete a comment
router.delete('/deleteComment/:serverId/:commentId', verifyAuth, serverPermissions, (req, res) => {
    if (req.params.serverId.match(/^[0-9a-fA-F]{24}$/) && req.params.commentId.match(/^[0-9a-fA-F]{24}$/)) {
        CommentModel().findById(req.params.commentId).then((comment) => {
            if ((req.userId === comment.authorId) || (req.permission >= 3)){
                CommentModel().findByIdAndDelete(comment._id).then((deletedComment) => {
                    res.sendStatus(200);
                }).catch((err) => {
                    res.sendStatus(400);
                })
            } else {
                res.sendStatus(401);
            }
            //Eventual TODO: moderators can also delete
        });
    } else {
        res.sendStatus(404);
    }
});

//Edit the text of an existing post.
router.post('/editPost/:serverId/:postId', verifyAuth, serverPermissions, fileUpload, (req, res) => {
    if (req.params.serverId.match(/^[0-9a-fA-F]{24}$/) && req.params.postId.match(/^[0-9a-fA-F]{24}$/)) {
        PostModel().findById(req.params.postId).then((post) => {
            if (req.userId === post.authorId) {
                post.postText = req.body.displayPostText;
                post.save().then((savedPost) => {
                    res.status(200).json(savedPost.postText);
                })
            }
        });
    } else {
        res.sendStatus(404);
    }
})

//Delete existing post.
router.delete('/deletePost/:serverId/:postId', verifyAuth, serverPermissions, (req, res) => {
    if (req.params.serverId.match(/^[0-9a-fA-F]{24}$/) && req.params.postId.match(/^[0-9a-fA-F]{24}$/)) {
        PostModel().findById(req.params.postId).then((post) => {
            
            if ((req.userId === post.authorId) || (req.permission >= 3)){
                PostModel().findByIdAndDelete(post._id).then((deletedPost) => {

                    //Check if that was the server thumbnail, if so, remove server thumbnail.
                    ServerModel().findById(req.params.serverId).then((server) => {
                        if (req.params.postId === server.avatarPostId) {
                            server.avatarPostId = null;
                            server.save();
                        }
                        res.sendStatus(200);
                    }); 
                }).catch((err) => {
                    res.sendStatus(400);
                })
            } else {
                res.sendStatus(401);
            }
        });
    } else {
        res.sendStatus(404);
    }
});




module.exports = router;
