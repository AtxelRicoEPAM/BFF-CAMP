const express = require('express');
const axios = require('axios').default;
const router = express.Router();
const {uuid} = require('uuidv4');

const {CartController} = require('../../controllers/CartController.js');
const {CheckoutController} = require('../../controllers/CheckoutController.js');
const {CmToolsController} = require('../../controllers/CmToolsController.js');
const {clientId,clientSecret, agent, CMTOOLS_API_URL } = require('../../constants.js');

const controller = new CartController()
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
    try{
        const cartData = await axios.get(`https://magento.test/rest/V1/guest-carts/${req.params['id']}`,
        {
            httpsAgent: agent,
            headers: options.headers
        })
        const storefrontCart = await controller.formatMagentoCarToStorefront(cartData.data,req.params['id'])        

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

router.post('/carts/:id/order', async (req,res) => {
    console.log('Create order')
    try{
        res.status(201).send({
            message:'Order created succesfully',
            reserved_order_id: await CheckoutController.createOrder(req.params['id'])
        });
    }catch(error){
        res.status(400).send({message:`something went wrong. ${error}`});
    }
});

module.exports = router