//Written by Karl Pollock, 2022.
//KarlPollock91@gmail.com
//www.karlpollock.com

//serverSecurityModel.js contains the database model for security settings attached to a server.

const mongoose = require('mongoose');

var schema;
var model;

function createSchema() {
    schema = mongoose.Schema({
        serverId: { type: String, required: true},
        postsVisibility: {type: Number, required: true},
        allowJoin: {type: Number, required: true},
        allowComment: {type: Number, required: true},
        usersVisibility: {type: Number, required: true}
    });
}

function getModel() {
    if (!schema) {
        createSchema();
    }
    return mongoose.model("ServerSecurity", schema);
}

module.exports = getModel;