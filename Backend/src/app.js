const express = require('express');
const dotenv = require('dotenv')
const connectDB = require('./db/db');

const app = express();

dotenv.config();

connectDB();


app.get('/' ,(req, res)=>{
    res.send('server start....')
})

module.exports = app;