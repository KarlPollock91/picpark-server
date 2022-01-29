//Written by Karl Pollock, 2022.
//KarlPollock91@gmail.com
//www.karlpollock.com

//accountsRoute.js routes for /accounts/ and contains all routing related to user accounts.

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");

const router = express.Router();
const fileUpload = require('../middleware/fileUpload.js');

const UserModel = require('../db/models/userModel');
const PermissionsModel = require('../db/models/permissionsModel');
const PostModel = require('../db/models/postModel');
const UserSecurityModel = require("../db/models/userSecurityModel");

const verifyAuth = require('../middleware/verifyAuth');

//Register new account
router.post('/register', fileUpload, (req, res) => {
    bcrypt.hash(req.body.password, parseInt(process.env.PASSWORD_HASH_SALT_PASSES)).then((hashedPassword) => {
        const user = new UserModel()({
            username: req.body.username, 
            accountName: req.body.accountName, 
            password: hashedPassword,
        });
        user.save().then((savedUser) => {

            const userSecurityModel = new UserSecurityModel()({
                userId: savedUser._id,
                serversVisibility: 0
            })

            userSecurityModel.save().then((savedSecurityModel) => {
                if (req.file != null && req.file.mimetype.split('/')[0] === "image") {
                    const thumbnailImage = new PostModel()({
                        dataId: req.file.id,
                        authorId: savedUser._id,
                        dataType: "image",
                        date: Date.now()
                    })
                    thumbnailImage.save().then((savedImage) => {
                        savedUser.avatarPostId = savedImage._id;
                        savedUser.save().then((updatedUser) => {
                            res.status(200).json({userId: updatedUser._id});
                        })
                    })
                } else if(req.file != null) {
                    //Delete file
                } else {
                    res.status(200).json({userId: savedUser._id});
                }
            })
            
        }).catch((err) => {
            res.status(400).send("Account name already in use.")
        });
        
    });
});

//Log user in.
router.post('/login', (req, res) => {

    UserModel().findOne({accountName: req.body.accountName}).then((account) => {
        if (account) {
            bcrypt.compare(req.body.password, account.password).then((correct) => {
                if (correct) {
                    const payload = {
                        id: account._id,
                        accountName: account.accountName
                    }
                    jwt.sign(
                        payload,
                        process.env.SECURITY_KEY,
                        {expiresIn: 86400},
                        (err, token) => {
                            if (err) {
                                res.send(err);
                            }
                            res.status(200).json({
                                message: "succ",
                                token: "Bearer " + token
                            })

                        }
                    )
                } else {
                    res.status(401).send("Incorrect Account Name/Password.");
                }
            })
        } else {
            res.status(401).send("Incorrect Account Name/Password.");
        }
    })
});

//Updates a profile.
router.post('/updateProfile/:userId', verifyAuth, fileUpload, (req, res) => {
    if (req.params.userId.match(/^[0-9a-fA-F]{24}$/)) {
        if (req.userId === req.params.userId) {
            UserModel().findById(req.userId).then((user) => {

                const previousAvatarPostId = user.avatarPostId;

                user.username = req.body.editUsername;

                UserSecurityModel().findOne({userId: req.params.userId}).then((userSecurity) => {

                    userSecurity.serversVisibility = req.body.userSecurities.serversVisibility;

                    userSecurity.save().then((savedUserSecurity) => {

                        if (req.file != null && req.file.mimetype.split('/')[0] === "image") {
                            const thumbnailImage = new PostModel()({
                                dataId: req.file.id,
                                authorId: user._id,
                                dataType: "image",
                                date: Date.now()
                            })
                            thumbnailImage.save().then((savedImage) => {
                                user.avatarPostId = savedImage._id;
                                user.save().then((updatedUser) => {
                                    PostModel().findByIdAndDelete(previousAvatarPostId);
                                    res.sendStatus(200);
                                })
                            })
                        } else {
                            user.save().then((updatedUser) => {
                                res.sendStatus(200);
                            });
                        }
                    })

                })
            })
        } else {
            res.sendStatus(401);
        }
    } else {
        res.sendStatus(404);
    }
})

//Returns permission objects of servers attached to current user.
router.get('/userServers/:userId', verifyAuth, (req, res) => {
    if (req.params.userId.match(/^[0-9a-fA-F]{24}$/)) {
        UserModel().findById(req.params.userId).then((user) => {
            UserSecurityModel().findOne({userId: req.params.userId}).then((userSecurities) => {
                PermissionsModel().find({userId: req.params.userId, permissions: {$gt: '0'}}).then((profilePermissions) => {
                    if (userSecurities.serversVisibility === 0 || (req.params.userId === req.userId)) {
                        //User has no security settings enabled.
                        res.status(200).json({permissions: profilePermissions});
                    } else if (userSecurities.serversVisibility === 1) {
                        //User has security settings to hide some servers enabled.
        
                        PermissionsModel().find({userId: req.userId}).then((searcherPermissions) => {
                            const matchingServers = [];
                            for (let profilePermission in profilePermissions) {
                                for (let searcherPermission in searcherPermissions) {
                                    if (profilePermission.serverId === searcherPermission.serverId) {
                                        matchingServers.push(profilePermission)
                                    }
                                }
                            }
                            res.status(200).json({permissions: matchingServers});
        
                        })
                    } else {
                        //User has their servers hidden
                        res.sendStatus(200);
                    }
                    
                })
            })
        })
    } else {
        res.sendStatus(404);
    }
})

//Retrieves a single user profile.
router.get('/getUser/:userId', verifyAuth, (req, res) => {
    if (req.params.userId.match(/^[0-9a-fA-F]{24}$/)) {
        UserModel().findById(req.params.userId).then((user) => {
            var response = {
                profileObject: {
                    username: user.username,
                    avatarPostId: user.avatarPostId,
                    _id: user._id,
                }, 
                userId: req.userId
            }
            if (req.params.userId === req.userId) {
                response.securityObject = {viewServerSecurity: user.viewServerSecurity};
            }
            res.status(200).json(response);
        }).catch((err) => {
            res.sendStatus(400);
        });
    }
    else {
        res.sendStatus(404);
    }
})

//Returns users own security options
router.get('/userSecurities', verifyAuth, (req, res) => {
    UserSecurityModel().findOne({userId: req.userId}).then((userSecurity) => {
        res.status(200).json(userSecurity);
    })
})

router.get('/verifyAuth', verifyAuth);

module.exports = router;
