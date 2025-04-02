const express = require('express')
const axios = require('axios').default;
const router = express.Router()

const {CmToolsController} = require('../../controllers/CmToolsController.js');
const {clientId, clientSecret, agent, CMTOOLS_API_URL } = require('../../constants.js');

router.get('/products',async (req,res)=>{
    console.log(req.get('origin')+' called /products')
    console.log(req.query)
    const {categoryId, offset, limit } = req.query
    const accessToken = await CmToolsController.getCmToolsAccessToken(clientId,clientSecret);
    //TODO Add conditionals in case some params are missing
    axios.get(`${CMTOOLS_API_URL}/atxel-rico-camp/product-projections/search?filter=categories.id:subtree("${CmToolsController.getCMToolsCategoryId(categoryId)}")&limit=${limit}&offset=${offset}`,
        {
            httpsAgent: agent,
            headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken.data.access_token}`
                }
        })
        .then(async (result) => {
            console.log('Success ',result)            
            res.status(201).send(CmToolsController.transformTextsToStoreFront(result.data))
        }
        )
        .catch(function (error) {
            console.log(error)
            res.status(400).send(error.data)
        })
});

router.get('/products/:sku', async (req,res) => {
    console.log(req.params);
    console.log('called /products/sku '+req.params['sku']);
    const accessToken = await CmToolsController.getCmToolsAccessToken(clientId,clientSecret);
    axios.get(`${CMTOOLS_API_URL}/atxel-rico-camp/product-projections/search?filter=variants.sku:"${req.params['sku']}"`,
        {
            httpsAgent: agent,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken.data.access_token}`
            }
        })
        .then(async (result) => {            
            res.status(201).send(CmToolsController.transformTextsToStoreFront(result.data).results[0])
        }
        )
        .catch(function (error) {
            console.log(error)
            res.status(400).send(error.data)
        })
});

module.exports = router;