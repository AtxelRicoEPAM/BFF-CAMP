const express = require('express')
const axios = require('axios').default;
const router = express.Router()

const {CategoryController} = require('../controllers/CategoryController.js')
const {ProductController} = require('../controllers/ProductController.js')
const {agent, options} = require('../constants.js');


router.get('/products',(req,res)=>{
    console.log(req.get('origin')+' called /products')
    console.log(req.query)
    const {categoryId, offset, limit } = req.query
    //TODO Add conditionals in case some params are missing
    axios.get(`http://localhost:80/rest/default/V1/products?searchCriteria[filterGroups][0][filters][0][field]=category_id&searchCriteria[filterGroups][0][filters][0][value]=${categoryId}&searchCriteria[pageSize]=${limit}&searchCriteria[currentPage]=${offset}`,
        {
            httpsAgent: agent,
            headers: options.headers
        })
        .then(async (result) => {
            console.log('category item count '+result.data['items'].length)
            res.status(201).send({'results':await CategoryController.transformMagentoProductsToStorefront(result.data['items']), 'total': result.data['items'].length, 'limit':req.query['limit'], 'offset':req.query['offset']})
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
            
            res.status(201).send(await ProductController.transformMagentoProductToStorefront(result.data))
        }
        )
        .catch(function (error) {
            console.log(error)
            res.status(400).send(error.data)
        })
})

module.exports = router;