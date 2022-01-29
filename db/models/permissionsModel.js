//Written by Karl Pollock, 2022.
//KarlPollock91@gmail.com
//www.karlpollock.com

//permissionsModel.js contains the database model for user permissions in relation to a server.


const mongoose = require('mongoose');

var schema;
var model;

function createSchema() {
    schema = mongoose.Schema({
        serverId: { type: String, required: true},
        userId: {type: String, required: true},
        permissions: {type: Number, required: true}
    });
}

function getModel() {
    if (!schema) {
        createSchema();
    }
    return mongoose.model("Permissions", schema);
}

module.exports = getModel;