//Written by Karl Pollock, 2022.
//KarlPollock91@gmail.com
//www.karlpollock.com

//connection.js exists to establish and retrieve a connection to the mongodb server.

const mongodb = require('mongodb');
const mongoose = require('mongoose');

var db;


async function connect() {
    console.log("Connecting to MongoDB");
    mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    db = mongoose.connection;

    db.once('open', () => {
        console.log("MongoDB connection open");
    });
    db.once('error', (err) => {
        console.log(err);
    });
}

async function get() {
    if (!db) {
        await connect();
    }
    return db;
}

module.exports = {
    get, connect
}