const express = require('express');
const dotenv = require('dotenv')
const cors = require('cors')
const connectDB = require('./db/db');
const authSystem = require('./routes/auth.routes')

const app = express();
app.use(express.json())
app.use(cors())

dotenv.config();
connectDB();

app.use('/api/auth' , authSystem);


app.get('/' ,(req, res)=>{
    res.send('server start....')
})

module.exports = app;