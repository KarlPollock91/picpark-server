//Written by Karl Pollock, 2022.
//KarlPollock91@gmail.com
//www.karlpollock.com

//verifyAuth.js exists to make sure the user is still logged in and is who they say they are.
//This is used in every route on the server.

const jwt = require("jsonwebtoken");
const UserModel = require('../db/models/userModel');

const verifyAuth = (req, res, next) => {
    var token = req.headers["x-access-token"];
    if (token) {
        token = token.split(' ')[1]

        jwt.verify(token, process.env.SECURITY_KEY, (err, decoded) => {
            if (err) {
                return res.status(401).send("Failed to Authenticate");
            }
            const id = decoded.id;
            const accountName = decoded.accountName;

            UserModel().findById(id).then((account) => {

                if ((account) && (account.accountName === accountName)) {
                    if (req.originalUrl === '/accounts/verifyAuth') {
                        res.status(200).json({
                                username: account.username,
                                _id: account._id,
                                avatarPostId: account.avatarPostId
                            });
                    }  else {
                        req.userId = id;
                        req.avatarPostId = account.avatarPostId;
                        next();
                    }
                }
                
            }).catch((err) => {
                res.status(401);
            });
        })
    } else {
        res.status(401);
    }
};

module.exports = verifyAuth;