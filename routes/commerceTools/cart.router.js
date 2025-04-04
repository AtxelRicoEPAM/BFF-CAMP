const express = require('express');
const axios = require('axios').default;
const router = express.Router();
const {v4: uuidv4} = require('uuid');

const { CmToolsCartController } = require('../../controllers/CmToolsCartController.js');
const {CmToolsCheckoutController} = require('../../controllers/CmToolsCheckoutController.js');
const {CmToolsController} = require('../../controllers/CmToolsController.js');
const {clientId,clientSecret, agent, CMTOOLS_API_URL } = require('../../constants.js');

const controller = new CmToolsCartController()
router.post('/carts',async (req,res) => {
    console.log(`called /carts`);
    const accessToken = await CmToolsController.getCmToolsAccessToken(clientId,clientSecret);
    try{
        const cartToken = await axios.post(`${CMTOOLS_API_URL}/atxel-rico-camp/carts`, 
        {
            currency:'USD'
        },
        {
            httpsAgent: agent,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken.data.access_token}`
            }
        });
        res.status(201).send({id:cartToken.data['id'],customerId:null,lineItems:cartToken.data['lineItems'],totalPrice:cartToken.data['totalPrice'],totalQuantity:cartToken.data['lineItems'].length,version:cartToken.data['version']});
    }catch(error){
        console.log(error);
        return 'Could not find a cart with such ID';
    }
});

router.get('/carts/:id',async (req,res) => {
    if(req.params['id']==='mocked-cart-id')
        return {message:'mocked-cart'}
    console.log(`called /carts/${req.params['id']}`);
    const accessToken = await CmToolsController.getCmToolsAccessToken(clientId,clientSecret);
    try{
        const storefrontCart = await axios.get(`${CMTOOLS_API_URL}/atxel-rico-camp/carts/${req.params['id']}`,
            {
                httpsAgent: agent,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken.data.access_token}`
                }
            });     
        
        let cart = storefrontCart.data
        console.log('strfront cart',cart)   
        cart = CmToolsController.transformCartTextsToStorefront(cart);
        res.status(200).send(cart);
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

router.post('/carts/:id/order', async (req,res) => {
    console.log('Create order')
    try{
        res.status(201).send({
            message:'Order created succesfully',
            reserved_order_id: await CmToolsCheckoutController.createOrder(req.params['id'])
        });
    }catch(error){
        res.status(400).send({message:`something went wrong. ${error}`});
    }
});

router.post('/checkout', (req, res) => {
    console.log('checkout',req.query)
    console.log({data: {id:uuidv4()}})
    res.status(201).send({data: {id:uuidv4()}})
})

module.exports = router