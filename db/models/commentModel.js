//Written by Karl Pollock, 2022.
//KarlPollock91@gmail.com
//www.karlpollock.com

//commentModel.js contains the database model for post comments.

const mongoose = require('mongoose');

var schema;

function createSchema() {
    schema = mongoose.Schema({
        authorId: {type: String, required: true},
        serverId: {type: String, required: true},
        postId: {type: String, required: true},
        commentText: {type: String},
        date: {type: Date, required: true}
    });
}

function getModel() {
    if (!schema) {
        createSchema();
    }
    return mongoose.model("Comments", schema);
}

module.exports = getModel;