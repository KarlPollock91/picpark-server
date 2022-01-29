//Written by Karl Pollock, 2022.
//KarlPollock91@gmail.com
//www.karlpollock.com

//userModel.js contains the database model for user accounts.

const mongoose = require('mongoose');

var schema;
var model;

function createSchema() {
    schema = mongoose.Schema({
        username: { type: String, required: true},
        accountName: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        avatarPostId: {type: String},
    });
}

function getModel() {
    if (!schema) {
        createSchema();
    }
    return mongoose.model("Users", schema);
}

module.exports = getModel;