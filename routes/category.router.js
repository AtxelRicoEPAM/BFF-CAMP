const express = require('express')
const axios = require('axios').default;
const router = express.Router()

const {CategoryController} = require('../controllers/CategoryController.js')
const {agent, options} = require('../constants.js')

router.get('/categories', (req, res) => {
    console.log(req+' called /categories')
    axios.get(`http://localhost:80/rest/default/V1/categories`,
        {
            httpsAgent: agent,
            headers: options.headers
        })
        .then((result) => {            
            res.status(201).send(CategoryController.transformCategoryData([result.data]))
        }
        )
        .catch(function (error) {
            console.log('Error '+error)
            res.status(400)
        })
});

module.exports = router;