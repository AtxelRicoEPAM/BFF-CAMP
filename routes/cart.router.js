const express = require('express');
const axios = require('axios').default;
const router = express.Router();

const CartController = require('../controllers/CartController.js');
const {agent, options} = require('../constants.js');

router.post('/carts',async (req,res) => {
    console.log(`called /carts`);
    try{
        const cartToken = await axios.post('https://magento.test/rest/V1/guest-carts', null,
        {
            httpsAgent: agent,
            headers: options.headers
        });
        res.status(201).send({id:cartToken.data});
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
        res.status(200).send({id:cartData.data});
    }catch(error){
        console.log(error);
        return 'Could not find a cart with such ID';
    }
});

router.put('/carts/:id', async (req, res) => {
    try{
        const cartData = await axios.put(`https://magento.test/rest/V1/guest-carts/${req.params['id']}`, null,
        {
            httpsAgent: agent,
            headers: options.headers
        })
        res.status(200).send(cartData);
    }catch(error){
        console.log(error);
        return 'Could not find a cart with such ID';
    }
});

module.exports = router