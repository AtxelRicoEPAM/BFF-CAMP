
const axios = require('axios').default;
const categoriesMap = require('../categories-map.json');
class CmToolsController{
    static async getCmToolsAccessToken(user,password){
        const token = axios.post('https://auth.us-east-2.aws.commercetools.com/oauth/token',
            new URLSearchParams({
                grant_type:'client_credentials',
                scope:'manage_project:atxel-rico-camp'
            }),
            {
                auth: {
                    username:user,
                    password:password
                },
                header: {
                    'Content-Type':'application/x-www-form-urlencoded'
                }
            }
        );
        return token;
    }

    static transformNameToStoreFront(products){
        const productTransformed =  products['results'].map( (product) => {return {...product,name: product.name['en-US']} } );
        console.log('product transformed',productTransformed)
        let productsDict = products;
        productsDict['results'] = productTransformed;
        console.log('dict',productsDict)
        return productsDict;
    }

    static getCMToolsCategoryId(storefrontId){
        return categoriesMap[storefrontId];
    }
}

exports.CmToolsController = CmToolsController;