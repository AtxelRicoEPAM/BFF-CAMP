const express = require('express');
const cors = require('cors');
const app = require('express')();
require('dotenv').config();

const categoryRouter = require('./routes/category.router.js');
const productRouter = require('./routes/product.router.js');
const cartRouter = require('./routes/cart.router.js')
const cmToolsCategoryRouter = require('./routes/commerceTools/category.router.js');
const cmToolsProductRouter = require('./routes/commerceTools/product.router.js');
const cmToolsCartRouter = require('./routes/commerceTools/cart.router.js');
const {PORT} = require('./constants.js');

app.use(express.static('public'))
app.use(express.json());
app.use(cors({origin:'http://localhost:3000'}));

if(process.env.SOURCE == 'MAGENTO'){
    console.log('Source:',process.env.SOURCE)
    app.use('/',categoryRouter);
    app.use('/',productRouter);
    app.use('/',cartRouter);

}
if(process.env.SOURCE == 'CMTOOLS'){
    console.log('Source:',process.env.SOURCE)
    app.use('/',cmToolsCategoryRouter);
    app.use('/',cmToolsProductRouter);
    app.use('/',cmToolsCartRouter);
}

app.listen(
    PORT,
    () => console.log(`running on http://localhost:${PORT}`)
)