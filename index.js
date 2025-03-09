const express = require('express');
const axios = require('axios').default;
const https = require('https');
const cors = require('cors');
const app = require('express')();

const {CategoryFormatter} = require('./Formatters/CategoryFormatter.js')
const {ProductFormatter} = require('./Formatters/ProductFormatter.js')
const {PORT, USERTOKEN} = require('./constants.js');
const agent = new https.Agent({rejectUnauthorized: false})

const options = {
    method: 'GET',
    headers:{
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${USERTOKEN}`
    }
}
app.use(express.json())
app.use(cors())
app.get('/categories', (req, res) => {
    console.log(req+' called /categories')
    axios.get(`http://localhost:80/rest/default/V1/categories`,
        {
            httpsAgent: agent,
            headers: options.headers
        })
        .then((result) => {            
            res.status(201).send(CategoryFormatter.transformCategoryData([result.data]))
        }
        )
        .catch(function (error) {
            console.log('Error '+error)
            res.status(400)
        })
});

app.get('/products',(req,res)=>{
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
            res.status(201).send({'results':await CategoryFormatter.transformMagentoProductsToStorefront(result.data['items']), 'total': result.data['items'].length, 'limit':req.query['limit'], 'offset':req.query['offset']})
        }
        )
        .catch(function (error) {
            console.log(error)
            res.status(400).send(error.data)
        })
});

app.get('/products/:sku', (req,res) => {
    console.log(req.params)
    console.log('called /products/sku '+req.params['sku'])
    axios.get(`http://localhost:80/rest/default/V1/products/${req.params['sku']}`,
        {
            httpsAgent: agent,
            headers: options.headers
        })
        .then(async (result) => {
            
            res.status(201).send(await ProductFormatter.transformMagentoProductToStorefront(result.data))
        }
        )
        .catch(function (error) {
            console.log(error)
            res.status(400).send(error.data)
        })
})

app.listen(
    PORT,
    () => console.log(`running on http://localhost:${PORT}`)
)