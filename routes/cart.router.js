const express = require('express');
const axios = require('axios').default;
const router = express.Router();

const {CartController} = require('../controllers/CartController.js');
const {agent, options} = require('../constants.js');

const controller = new CartController()
router.post('/carts',async (req,res) => {
    console.log(`called /carts`);
    try{
        const cartToken = await axios.post('https://magento.test/rest/V1/guest-carts', null,
        {
            httpsAgent: agent,
            headers: options.headers
        });
        res.status(201).send({id:cartToken.data,version:0,customerId:null,lineItems:[],totalPrice:{currencyCode:"USD",centAmount:0},totalQuantity:0});
    }catch(error){
        console.log(error);
        return 'Could not find a cart with such ID';
    }
});

router.get('/carts/:id',async (req,res) => {
    if(req.params['id']==='mocked-cart-id')
        return {message:'mocked-cart'}
    console.log(`called /carts/${req.params['id']}`);
    try{
        const cartData = await axios.get(`https://magento.test/rest/V1/guest-carts/${req.params['id']}`,
        {
            httpsAgent: agent,
            headers: options.headers
        })
        const storefrontCart = controller.formatMagentoCarToStorefront(cartData.data,req.params['id'])
        console.log('CARTS ID: ',storefrontCart)
        res.status(200).send(storefrontCart);
    }catch(error){
        console.log(error);
        return 'Could not find a cart with such ID';
    }
});

router.put('/carts/:id', async (req, res) => {
    console.log(req.body)
    try{
        res.status(201).send(await controller.determineAction(req));
    }catch(error){
        res.status(400).send({message:`something went wrong. ${error}`});

    }
});

module.exports = router