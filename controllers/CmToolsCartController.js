const axios = require('axios').default;
const { clientId, clientSecret, CMTOOLS_API_URL, agent, options } = require('../constants.js');

const { ProductController } = require('./ProductController.js');
const { CheckoutController } = require('./CheckoutController.js');
const { CmToolsController } = require('./CmToolsController.js');
class CmToolsCartController {
    constructor() {
        this.actionsMap = {
            'AddLineItem': this.AddLineItem,
            'ChangeLineItemQuantity': this.ChangeLineItemQuantity,
            'RemoveLineItem': this.RemoveLineItem,
            'SetShippingAddress': this.SetShippingAddress,
        }
    }
    async determineAction(requestObject) {
        console.log('param cmtools', requestObject.body.action)
        return await this.actionsMap[requestObject.body.action](requestObject.body, requestObject.params['id']);
    }

    async AddLineItem(body, cartId) {
        console.log(body, 'AddLineItem ' + cartId);
        const productData = await CmToolsCartController.getProductBySKU(body.AddLineItem.variantId);
        console.log('product', productData);
        
        const accessToken = await CmToolsController.getCmToolsAccessToken(clientId, clientSecret);
        try {
            const cartToken = await axios.post(`${CMTOOLS_API_URL}/atxel-rico-camp/carts/${cartId}`,
                {
                    "version": await CmToolsCartController.getCartVersion(cartId),
                    "actions": [{
                        "action": "addLineItem",
                        "productId": productData.results[0]['id'],
                        "variantId": CmToolsCartController.getVariantIdBySKU(productData.results[0].variants,body.AddLineItem.variantId),
                        "quantity": 1
                    }]
                },
                {
                    httpsAgent: agent,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken.data.access_token}`
                    }
                });
            return { id: cartToken.data['id'], customerId: null, lineItems: cartToken.data['lineItems'], totalPrice: cartToken.data['totalPrice'], totalQuantity: cartToken.data['lineItems'].length, version: cartToken.data['version'] };
        } catch (error) {
            console.log(error);
            return 'Could not find a cart with such ID';
        }
    }

    async ChangeLineItemQuantity(body, cartId) {
        console.log(body, 'Change quantity ' + cartId);
        const cartData = await CmToolsCartController.getCartById(cartId);        
        const accessToken = await CmToolsController.getCmToolsAccessToken(clientId, clientSecret);
        try {
            const cartToken = await axios.post(`${CMTOOLS_API_URL}/atxel-rico-camp/carts/${cartId}`,
                JSON.stringify({
                    "version": cartData["version"],
                    "actions": [{
                        "action": "changeLineItemQuantity",
                        "lineItemId": body.ChangeLineItemQuantity.lineItemId,                        
                        "quantity": body.ChangeLineItemQuantity.quantity
                    }]
                }),
                {
                    httpsAgent: agent,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken.data.access_token}`
                    }
                });            
            return { id: cartToken.data['id'], customerId: null, lineItems: cartToken.data['lineItems'], totalPrice: cartToken.data['totalPrice'], totalQuantity: cartToken.data['lineItems'].length, version: cartToken.data['version'] };
        } catch (error) {
            console.log(error);
            return 'Could not update quantity';
        }
    }

    async RemoveLineItem(body, cartId) {
        console.log('DELETE',body)
        const cartData = await CmToolsCartController.getCartById(cartId);        
        const accessToken = await CmToolsController.getCmToolsAccessToken(clientId, clientSecret);
        try {
            const cartToken = await axios.post(`${CMTOOLS_API_URL}/atxel-rico-camp/carts/${cartId}`,
                JSON.stringify({
                    "version": cartData["version"],
                    "actions": [{
                        "action": "removeLineItem",
                        "lineItemId": body.RemoveLineItem.lineItemId,                                                
                    }]
                }),
                {
                    httpsAgent: agent,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken.data.access_token}`
                    }
                });            
            return { id: cartToken.data['id'], customerId: null, lineItems: cartToken.data['lineItems'], totalPrice: cartToken.data['totalPrice'], totalQuantity: cartToken.data['lineItems'].length, version: cartToken.data['version'] };
        } catch (error) {
            console.log(error);
            return 'Could not remove product from cart';
        }
    }

    getTotalPrice(lineItems) {
        const totalAmount = lineItems.reduce((accumulator, current) => {
            return accumulator + (current.prices[0].value.centAmount * current.qty)
        }

            , 0)

        return {
            currencyCode: "USD",
            centAmount: totalAmount
        }
    }
    async formatMagentoCarToStorefront(magentoCart, cartId) {
        const variants = await Promise.all(await this.getVariantForEachLineItem(magentoCart.items))
        return {
            version: 0,
            customerId: null,
            lineItems: variants,
            totalPrice: this.getTotalPrice(variants),
            totalQuantity: magentoCart.items_qty,
            id: cartId,

        }
    }

    async getVariantForEachLineItem(lineItems) {
        return await lineItems.map(async (current, index) => {
            const { prices, images, masterVariant } = await ProductController.getProductBySKU(current.sku);
            current.id = current.item_id;
            current.prices = prices;
            current.variant = masterVariant;
            current.images = [images];
            current.quantity = current.qty;
            current.totalPrice = prices[0].value.centAmount * current.qty;
            current.productId = current.item_id;
            current.variant.name = current.name;
            return current
        });
    }


    async SetShippingAddress(body, cartId) {
        console.log('Set shipping address');
        return await CheckoutController.SetShippingAddress(body, cartId);

    }

    static async getProductBySKU(sku) {
        console.log('XD', sku)
        const accessToken = await CmToolsController.getCmToolsAccessToken(clientId, clientSecret);
        const productData = await axios.get(`${CMTOOLS_API_URL}/atxel-rico-camp/product-projections/search?filter=variants.sku:"${sku}"`,
            {
                httpsAgent: agent,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken.data.access_token}`
                }
            });
        return productData.data
    }

    static async getCartVersion(cartId) {
        const accessToken = await CmToolsController.getCmToolsAccessToken(clientId, clientSecret);
        try {
            const storefrontCart = await axios.get(`${CMTOOLS_API_URL}/atxel-rico-camp/carts/${cartId}`,
                {
                    httpsAgent: agent,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken.data.access_token}`
                    }
                });
            return storefrontCart.data.version;
        } catch (error) {
            console.log(error);
            return 'Could not find a cart with such ID';
        }
    }

    static getVariantIdBySKU(variants,sku){
        return variants.map( (variant) => variant.sku === sku).id;
    }

    static async getCartById(cartId){
        const accessToken = await CmToolsController.getCmToolsAccessToken(clientId,clientSecret);
        try{
                const storefrontCart = await axios.get(`${CMTOOLS_API_URL}/atxel-rico-camp/carts/${cartId}`,
                    {
                        httpsAgent: agent,
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${accessToken.data.access_token}`
                        }
                    });     
                
                let cart = storefrontCart.data
                console.log('strfront cart',cart)   
                cart = CmToolsController.transformCartTextsToStorefront(cart);
                return cart
            }catch(error){
                console.log(error);
                return 'Could not find a cart with such ID';
            }
    }
}


exports.CmToolsCartController = CmToolsCartController;