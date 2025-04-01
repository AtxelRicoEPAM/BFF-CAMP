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
            res.status(201).send(CmToolsController.transformNameToStoreFront(result.data))
        }
        )
        .catch(function (error) {
            console.log(error)
            res.status(400).send(error.data)
        })
});

router.get('/products/:sku', (req,res) => {
    console.log(req.params)
    console.log('called /products/sku '+req.params['sku'])
    axios.get(`http://localhost:80/rest/default/V1/products/${req.params['sku']}`,
        {
            httpsAgent: agent,
            headers: options.headers
        })
        .then(async (result) => {
            
            //res.status(201).send(await ProductController.transformMagentoProductToStorefront(result.data))
        }
        )
        .catch(function (error) {
            console.log(error)
            res.status(400).send(error.data)
        })
})

module.exports = router;