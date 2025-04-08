const express = require('express')
const axios = require('axios').default;
const router = express.Router()

const { CmToolsController } = require('../../controllers/CmToolsController.js');
const { clientId, clientSecret, agent, CMTOOLS_API_URL } = require('../../constants.js');

router.get('/products', async (req, res) => {
    console.log(req.get('origin') + ' called /products')
    console.log(req.query)
    const { categoryId, offset, limit } = req.query
    const accessToken = await CmToolsController.getCmToolsAccessToken(clientId, clientSecret);
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
            res.status(201).send(CmToolsController.transformTextsToStoreFront(result.data))
        }
        )
        .catch(function (error) {
            console.log(error)
            res.status(400).send(error.data)
        })
});

router.get('/products/:sku', async (req, res) => {
    console.log(req.params);
    console.log('called /products/sku ' + req.params['sku']);
    const accessToken = await CmToolsController.getCmToolsAccessToken(clientId, clientSecret);
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

router.get('/promos/:sku', async (req, res) => {
    console.log('called /promos/', req.params['sku'])
    try {
        const result = await axios.get('https://cdn.contentstack.io/v3/content_types/camp_product/entries/',
            {
                httpsAgent: agent,
                headers: {
                    'api_key': 'blt7f7c5fb7b9e463a6',
                    'access_token': 'cs5a758c481944da0e364b09bc'

                }
            }
        )
        
        const productOffers = result.data['entries'].filter( (current) => current.commercetools_id === req.params['sku'])  
        console.log('Offers for this product: ',productOffers.length)
        let htmlBanners = [];
        for(const offer of productOffers){
            console.log('offer',offer)
            htmlBanners.push({text: ` 
                <div class="p-4 my-2 flex h-[300px] shadow bg-lime-100 rounded-xl">
                   <div class="flex-grow">
                         <h2 class="text-2xl font-serif">${offer['title']}</h2>
                         <p>${offer['description']}</p>
                   </div>
                   <div>
                         <img src="${offer['featured_image'][0]['url']}" alt="promo-2" 
                            class="h-[100%] rounded-xl"
                         />
                   </div>
                </div>
                `})
        }
        res.status(200).send({ sku: req.params['sku'], promos: htmlBanners, order: 12 })
    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }


})

module.exports = router;