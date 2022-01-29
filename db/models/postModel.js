//Written by Karl Pollock, 2022.
//KarlPollock91@gmail.com
//www.karlpollock.com

//postModel.js contains the database model for posts.


const mongoose = require('mongoose');

var schema;

function createSchema() {
    schema = mongoose.Schema({
        dataId: {type: String, required: true},
        authorId: {type: String, required: true},
        serverId: {type: String},
        postText: {type: String},
        dataType: {type: String, enum:["image", "video", "audio", "text"], required: true},
        date: {type: Date, required: true}
    });
}

function getModel() {
    if (!schema) {
        createSchema();
    }
    return mongoose.model("Posts", schema);
}

module.exports = getModel;