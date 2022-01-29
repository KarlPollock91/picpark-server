//Written by Karl Pollock, 2022.
//KarlPollock91@gmail.com
//www.karlpollock.com

//serversModel.js contains the database model for posts.

const mongoose = require('mongoose');

var schema;
var model;

function createSchema() {
    schema = mongoose.Schema({
        serverName: { type: String, required: true},
        avatarPostId: {type: String}
    });
}

function getModel() {
    if (!schema) {
        createSchema();
    }
    return mongoose.model("Servers", schema);
}

module.exports = getModel;