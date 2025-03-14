const axios = require('axios').default;
const { agent, options } = require('../constants.js');

const { ProductController } = require('./ProductController.js');
const { CheckoutController } = require('./CheckoutController.js');
class CartController {

    constructor() {
        this.actionsMap = {
            'AddLineItem': this.AddLineItem,
            'ChangeLineItemQuantity': this.ChangeLineItemQuantity,
            'RemoveLineItem': this.RemoveLineItem,
            'SetShippingAddress': this.SetShippingAddress,
        }
    }
    async determineAction(requestObject) {
        console.log('param ', requestObject.body.action)
        return await this.actionsMap[requestObject.body.action](requestObject.body, requestObject.params['id']);
    }

    async AddLineItem(body, cartId) {
        console.log(body, 'cart ' + cartId)
        try {
            const magentoResult = await axios.post(`https://magento.test/rest/V1/guest-carts/${cartId}/items`,
                {
                    cartItem: {
                        sku: body.AddLineItem.variantId,
                        qty: body.AddLineItem.quantity,
                        name: "",
                        price: 0,
                        product_type: "",
                        quoteId: cartId,
                    }
                },
                {
                    httpsAgent: agent,
                    headers: options.headers,
                })
            console.log(magentoResult.data)
            return magentoResult.data
        } catch (error) {
            console.log(error)
            return error
        }
    }

    async ChangeLineItemQuantity(body, cartId) {
        console.log('CHANGE URL ', `https://magento.test/rest/V1/guest-carts/${cartId}/items/${body.ChangeLineItemQuantity.lineItemId}`)
        try {
            const magentoResult = await axios.put(`https://magento.test/rest/V1/guest-carts/${cartId}/items/${body.ChangeLineItemQuantity.lineItemId}`,
                {
                    cartItem: {
                        item_id: body.ChangeLineItemQuantity.lineItemId,
                        qty: body.ChangeLineItemQuantity.quantity
                    }
                },
                {
                    httpsAgent: agent,
                    headers: options.headers,
                })
            console.log('CHANGE RESULT ', magentoResult.data)
            return magentoResult.data
        } catch (error) {
            console.log(error)
            return 'Could not change item quantity'
        }
    }

    async RemoveLineItem(body, cartId) {
        console.log('DELETE URL ', `https://magento.test/rest/V1/guest-carts/${cartId}/items/${body.ChangeLineItemQuantity.lineItemId}`)
        try {
            const magentoResult = await axios.delete(`https://magento.test/rest/V1/guest-carts/${cartId}/items/${body.ChangeLineItemQuantity.lineItemId}`,
                {
                    httpsAgent: agent,
                    headers: options.headers,
                })
            console.log('DELETE RESULT ', magentoResult.data)
            return magentoResult.data
        } catch (error) {
            console.log(error)
            return 'Could not DELETE item from cart'
        }
    }

    getTotalPrice(lineItems) {
        const totalAmount = lineItems.reduce((accumulator, current) =>
            {
            console.log(`total del carrito ${accumulator}`)
            console.log(`precio line ${current.prices[0].value.centAmount * current.qty}`)
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
    
    async getVariantForEachLineItem(lineItems){
        return await lineItems.map(async (current, index)=>{
            const {prices, images, masterVariant} = await ProductController.getProductBySKU(current.sku);
            current.id = current.item_id;
            current.prices = prices;            
            current.variant = masterVariant;
            current.images = [ images ];
            current.quantity = current.qty;
            current.totalPrice = prices[0].value.centAmount*current.qty;        
            current.productId = current.item_id;
            current.variant.name = current.name;            
            return current
        });    
    }


    async SetShippingAddress(body,cartId){
        console.log('Set shipping address');
        return await CheckoutController.SetShippingAddress(body,cartId);
        
    }
}


exports.CartController = CartController;