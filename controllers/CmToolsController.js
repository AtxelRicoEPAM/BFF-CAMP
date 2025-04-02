
const axios = require('axios').default;
const categoriesMap = require('../categories-map.json');
class CmToolsController {
    static async getCmToolsAccessToken(user, password) {
        const token = axios.post('https://auth.us-east-2.aws.commercetools.com/oauth/token',
            new URLSearchParams({
                grant_type: 'client_credentials',
                scope: 'manage_project:atxel-rico-camp'
            }),
            {
                auth: {
                    username: user,
                    password: password
                },
                header: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        return token;
    }

    static transformTextsToStoreFront(products) {
        const productTransformed = products['results'].map((product) => { return { ...product, name: product.name['en-US'], description: product.description['en-US'],masterVariant: { ...product.masterVariant, attributes: [product.masterVariant.attributes[1],product.masterVariant.attributes[0]] }, variants: product.variants.map((variant) => { return {...variant, attributes:[variant.attributes[1],variant.attributes[0]]}})}});        
        let productsDict = products;
        productsDict['results'] = productTransformed;
        return productsDict;
    }

    static getCMToolsCategoryId(storefrontId) {
        return categoriesMap[storefrontId];
    }
}

exports.CmToolsController = CmToolsController;