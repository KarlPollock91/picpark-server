//Written by Karl Pollock, 2022.
//KarlPollock91@gmail.com
//www.karlpollock.com

//serversRoute.js routes for /servers/ and contains all routing related to servers

const express = require('express');
const router = express.Router();

const ServerModel = require("../db/models/serversModel");
const ServerSecurityModel = require("../db/models/serverSecurityModel");
const PermissionsModel = require("../db/models/permissionsModel");
const PostModel = require("../db/models/postModel");
const CommentModel = require("../db/models/commentModel");

const verifyAuth = require("../middleware/verifyAuth");
const serverPermissions = require("../middleware/serverPermissions");

const fileUpload = require('../middleware/fileUpload.js');
const { response } = require('express');

//Create new server
router.post('/create', verifyAuth, fileUpload, (req, res) => {
    //Create the server document
    const server = new ServerModel()({
        serverName: req.body.serverName
    });
        
    server.save().then((savedServer) => {
        const serverSecurity = new ServerSecurityModel()({
            serverId: savedServer._id,
            postsVisibility: 0,
            allowJoin: 0,
            allowComment: 0,
            usersVisibility: 0
        });

        serverSecurity.save().then((savedServerSecurity) => {

            const permissions = new PermissionsModel()({
                serverId: savedServer._id,
                userId: req.userId,
                permissions: 5
            });

            permissions.save().then((savedPermissions) => {
                //If there's a thumbnail image to create
                if (req.file) {
                    //Create the image document
                    const post = new PostModel()({
                        dataId: req.file.id,
                        authorId: req.userId,
                        serverId: savedServer._id,
                        dataType: "image",
                        date: Date.now()
                    });
                    post.save().then((savedPost) => {
                        //Set the image document to be the server thumbnail
                        savedServer.avatarPostId = savedPost._id;
                        savedServer.save().then((updatedServer) => {
                            res.status(200).json({serverId: updatedServer._id});
                        });
                    });
                } else {
                    res.status(200).json({serverId: savedPermissions.serverId});
                }   
            });
        });
    }).catch((err) => {
        res.sendStatus(400);
    });
});

//Updates a server.
router.post('/updateServer/:serverId', verifyAuth, serverPermissions, fileUpload, (req, res) => {
    if (req.params.serverId.match(/^[0-9a-fA-F]{24}$/)) {
        ServerModel().findById(req.params.serverId).then((server) => {

            const previousAvatarPostId = server.avatarPostId;

            server.serverName = req.body.editServerName;

            ServerSecurityModel().findOne({serverId: req.params.serverId}).then((serverSecurities) => {

                serverSecurities.postsVisibility = req.body.postsVisibility;
                serverSecurities.allowJoin = req.body.allowJoin;
                serverSecurities.allowComment = req.body.allowComment;
                serverSecurities.usersVisibility = req.body.usersVisibility;

                serverSecurities.save().then((updatedSecurities) => {
                    if (req.file != null && req.file.mimetype.split('/')[0] === "image") {
                        const thumbnailImage = new PostModel()({
                            dataId: req.file.id,
                            authorId: req.userId,
                            dataType: "image",
                            date: Date.now()
                        })
                        thumbnailImage.save().then((savedImage) => {
                            server.avatarPostId = savedImage._id;
                            server.save().then((updatedUser) => {
                                PostModel().findByIdAndDelete(previousAvatarPostId);
                                res.sendStatus(200);
                            })
                        })
                    } else {
                        server.save().then((updatedServer) => {
                            res.sendStatus(200);
                        });
                    }
                })
            })
        })
    } else {
        res.sendStatus(404);
    }
})

//Gets all the posts contained on the server
router.get('/getPosts/:serverId', verifyAuth, serverPermissions, (req, res) => {
    PostModel().find({serverId: req.params.serverId}).sort({date: -1}).then((posts) => {
        res.status(200).json(posts);
    }).catch((err) => {
        res.sendStatus(400);
    })
})

//Get post singular based on serverId and PostId. 
router.get('/getPost/:serverId/:postId', verifyAuth, serverPermissions, (req, res) => {
    if ((req.params.serverId.match(/^[0-9a-fA-F]{24}$/)) && (req.params.postId.match(/^[0-9a-fA-F]{24}$/))) {
        PostModel().findById(req.params.postId).then((post) => {
            res.status(200).json({post: post, userId: req.userId});
        }).catch((err) => {
            res.sendStatus(400);
        })
    } else {
        res.sendStatus(404);
    }
})

//Gets a list of users for that server
router.get('/serverUsers/:serverId', verifyAuth, serverPermissions, (req, res) => {
    PermissionsModel().find({serverId: req.params.serverId}).then((permissions) => {
       res.status(200).json(permissions);
    }).catch((err) => {
        res.sendStatus(400);
    })
    
})

//Gets a server object from its ID.
router.get('/getServer/:serverId', verifyAuth, serverPermissions, (req, res) => {
    if (req.params.serverId.match(/^[0-9a-fA-F]{24}$/)) {
        ServerModel().findById(req.params.serverId).then((server) => {
            res.status(200).json({serverObject: server, permission: req.permission});
        }).catch((err) => {
            res.sendStatus(400);
        })
    } else {
        res.sendStatus(404)
    }
})

//Creates the permission objects for a user to join a server.
router.post('/joinServer/:serverId', verifyAuth, (req, res) => {
    PermissionsModel().findOne({serverId: req.params.serverId, userId: req.userId}).then((existingPerm) => {
        if (existingPerm) {
            res.sendStatus(200);
        } else {
            ServerSecurityModel().findOne({serverId: req.params.serverId}).then((serverSecurities) => {
                if (serverSecurities.allowJoin === 0) {
                    const permission = new PermissionsModel()({
                        serverId: req.params.serverId,
                        userId: req.userId,
                        permissions: 2
                    });
                    permission.save().then((savedPerm) => {
                        res.sendStatus(200);
                    })
                } else {
                    res.sendStatus(401);
                }
            })
        }
    })
})

//Deletes the permission objects for a user to join a server.
router.delete('/leaveServer/:serverId', verifyAuth, (req, res) => {
    PermissionsModel().findOne({serverId: req.params.serverId, userId: req.userId}).then((permissionObject) => {
        if ((permissionObject.permissions < 5) && (permissionObject.permissions > 0)) {
            permissionObject.delete();
            res.sendStatus(200);
        } else if (permissionObject.permissions === 5) {
            PermissionsModel().find({serverId: permissionObject.serverId, permissions: 5}).then((admins) => {
                if (admins.length > 1) {
                    permissionObject.delete();
                    res.sendStatus(200);
                } else {
                    res.sendStatus(202);
                }
            })
        } else {
            res.sendStatus(404);
        }
    })
})

//Removes the server and all posts/comments/permissions/settings attached to it.
router.delete('/deleteServer/:serverId', verifyAuth, serverPermissions, (req, res) => {
    if (req.params.serverId.match(/^[0-9a-fA-F]{24}$/)) {
        try {
            ServerModel().findByIdAndDelete(req.params.serverId).then((server) => {
                PostModel().deleteMany({serverId: req.params.serverId}).then((posts) => {
                    CommentModel().deleteMany({serverId: req.params.serverId}).then((comments) => {
                        PermissionsModel().deleteMany({serverId: req.params.serverId}).then((permissions) => {
                            ServerSecurityModel().deleteMany({serverId: req.params.serverId}).then((securities) => {
                                res.sendStatus(200);
                            });
                        });
                    });
                });
            })
        } catch (err) {
            res.sendStatus(404);
        }
    } else {
        res.sendStatus(404);
    }
    
})

//Retrieves the security settings for a server.
router.get('/serverSecurities/:serverId', verifyAuth, serverPermissions, (req, res) => {
    ServerSecurityModel().findOne({serverId: req.params.serverId}).then((serverSecurities) => {
        res.status(200).json({
            serverSecurities: serverSecurities,
            permissions: req.permission
        });
    })
})

//Retrieves the permission object a user has in relation to a server.
router.get('/userPermissions/:serverId/:userId', verifyAuth, serverPermissions, (req, res) => {
    PermissionsModel().findOne({serverId: req.params.serverId, userId: req.params.userId}).then((permission) => {
        res.status(200).json(permission);
    })
})

//Change the permission of a permission object of a user in relation to a server.
router.post('/changeRank/:serverId/:userId/:newRank', verifyAuth, serverPermissions, (req, res) => {
    PermissionsModel().findOne({serverId: req.params.serverId, userId: req.params.userId}).then((permission) => {
        if ((permission.permissions >= req.permission) || (req.userId === req.params.userId)) {
            res.sendStatus(401);
        } else {
            if (req.params.newRank == 1) {
                PermissionsModel().findOneAndDelete({serverId: req.params.serverId, userId: req.params.userId}).then((deletedPerm) => {
                    res.status(200).json(deletedPerm);
                });
            } else {
                permission.permissions = req.params.newRank;
                permission.save().then((savedPermission) => {
                res.status(200).json(savedPermission);
            })
            }
            
        }
    })
})

module.exports = router;
