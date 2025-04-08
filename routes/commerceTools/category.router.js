const express = require('express')
const axios = require('axios').default;
const router = express.Router()

const {CategoryController} = require('../../controllers/CategoryController.js');
const {CmToolsController} = require('../../controllers/CmToolsController.js');
const {clientId,clientSecret, agent, CMTOOLS_API_URL} = require('../../constants.js');

router.get('/categories', async (req, res) => {
    console.log(req+' called /categories');
    const accessToken = await CmToolsController.getCmToolsAccessToken(clientId,clientSecret);
    console.log(accessToken.data.access_token);
    axios.get(`${CMTOOLS_API_URL}/atxel-rico-camp/categories`,
        {
            httpsAgent: agent,
            headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken.data.access_token}`
                }
        })
        .then((result) => {            
            res.status(201).send({ola:'ola',results:result.data});
        }
        )
        .catch(function (error) {
            console.log('Error '+error)
            res.status(400)
        }) 
});

module.exports = router;