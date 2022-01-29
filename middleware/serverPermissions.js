//Written by Karl Pollock, 2022.
//KarlPollock91@gmail.com
//www.karlpollock.com

//serverPermissions.js ensures users have authorizaton to perform actions in relation to a server. 

const UrlPattern = require('url-pattern');

const PermissionsModel = require('../db/models/permissionsModel');
const ServerSecurityModel = require('../db/models/serverSecurityModel');

//Permisions
//0 - None - Banned
//1 - Non Member
//2 - Member
//3 - Super Member
//4 - Moderator
//5 - Admin


const serverPermissions = (req, res, next) => {

    //KEEP THIS FOR DEBUG
    // console.log(`Finding permission object userId: ${req.userId}, serverId: ${req.params.serverId} at ${req.originalUrl}`);

    ServerSecurityModel().findOne({serverId: req.params.serverId}).then((serverSecurity) => {
        if (req.userId && serverSecurity) {
            const PATH_PERMISSIONS = {
                '/servers/serverSecurities/:serverId': 0,
                '/servers/getServer/:serverId': 1,
                '/servers/getPosts/:serverId': 1 + serverSecurity.postsVisibility, 
                '/servers/getPost/:serverId/:postId': 1,
                '/servers/serverUsers/:serverId': 1 + serverSecurity.usersVisibility,
                '/servers/userPermissions/:serverId/:userId': 1 + serverSecurity.usersVisibility,
                '/posts/getComments/:serverId/:postId': 1 + serverSecurity.postsVisibility,
                '/posts/makeComment/:serverId/:postId': 1 + serverSecurity.allowComment,
                '/posts/upload/:serverId': 2,
                '/posts/deleteComment/:serverId/:commentId': 2,
                '/posts/editPost/:serverId/:postId': 2,
                '/posts/deletePost/:serverId/:postId': 2,
                '/servers/changeRank/:serverId/:userId/:newRank': 4,
                '/servers/updateServer/:serverId': 5,
                '/servers/deleteServer/:serverId': 5
            }
            PermissionsModel().findOne({userId: req.userId, serverId: req.params.serverId}).then((permissionObj) => {

                var userPermission = 1;

                if (permissionObj) {
                    userPermission = permissionObj.permissions;
                }
                for (let [key, value] of Object.entries(PATH_PERMISSIONS)) {
                    
                    //KEEP THIS FOR DEBUG
                    // console.log(`Attempting to match ${req.originalUrl} with ${key} and userpermission ${userPermission}`);
    
                    if ((new UrlPattern(key).match(req.originalUrl)) && ((userPermission >= value))) {
                        
                        //KEEP THIS FOR DEBUG
                        // console.log(`Successfully ${req.originalUrl} with ${key} at value ${value}`);
    
                        //Pass this to routes to allow for moderator specific actions
                        req.permission = userPermission;
    
                        next();
                        return;
                    }
    
                }
                
                return res.sendStatus(401);
            })
        } else {
            return res.sendStatus(404);
        }
    })

    
};

module.exports = serverPermissions;