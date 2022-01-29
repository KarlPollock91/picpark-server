//Written by Karl Pollock, 2022.
//KarlPollock91@gmail.com
//www.karlpollock.com

require("dotenv").config({ path: "./config.env" });

const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");

const connection = require("./db/connection.js")

const port = process.env.PORT || 5000;

const filesRouter = require('./routes/filesRoute.js');
const accountsRouter = require('./routes/accountsRoute.js');
const serversRouter = require('./routes/serversRoute.js');
const postsRouter = require('./routes/postsRoute.js');

app.use(cors());
app.use(express.json());

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());


app.use('/files', filesRouter);
app.use('/posts', postsRouter);
app.use('/accounts', accountsRouter);
app.use('/servers', serversRouter);


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
});