//Written by Karl Pollock, 2022.
//KarlPollock91@gmail.com
//www.karlpollock.com

//userSecurityModel.js contains the database model for security settings attached to a user account.

const mongoose = require('mongoose');

var schema;
var model;

function createSchema() {
    schema = mongoose.Schema({
        userId: { type: String, required: true},
        serversVisibility: {type: Number, required: true}
    });
}

function getModel() {
    if (!schema) {
        createSchema();
    }
    return mongoose.model("UserSecurity", schema);
}

module.exports = getModel;