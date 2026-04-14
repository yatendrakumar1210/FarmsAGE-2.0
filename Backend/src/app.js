const express = require('express');
const dotenv = require('dotenv')
require("dotenv").config();
const cors = require('cors')
const connectDB = require('./db/db');
const authSystem = require('./routes/auth.routes')
const paymentSystem = require('./routes/order.routes')
const adminSystem = require('./routes/admin.routes')
const addressSystem = require('./routes/address.routes');
const productsSystem = require('./routes/products.routes');
const googleAuth = require('./routes/auth.routes');

const app = express();
app.use(express.json())
app.use(cors())

dotenv.config();
connectDB();

app.use('/api/auth', authSystem);
app.use('/api/orders', paymentSystem);
app.use('/api/admin', adminSystem);
app.use('/api/address', addressSystem);
app.use('/api/products', productsSystem);
app.use('api/email', googleAuth);


app.get('/', (req, res) => {
    res.send('server start....')
})

module.exports = app;
