const express = require('express');
const cors = require('cors');
const app = require('express')();

const categoryRouter = require('./routes/category.router.js');
const productRouter = require('./routes/product.router.js');
const cartRouter = require('./routes/cart.router.js')
const {PORT} = require('./constants.js');

app.use(express.json());
app.use(cors());

//Import all routers
app.use('/',categoryRouter);
app.use('/',productRouter);
app.use('/',cartRouter);


app.listen(
    PORT,
    () => console.log(`running on http://localhost:${PORT}`)
)