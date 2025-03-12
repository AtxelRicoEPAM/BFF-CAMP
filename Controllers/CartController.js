const axios = require('axios').default;
const { agent, options } = require('../constants.js');

const { ProductController } = require('./ProductController.js');
class CartController {

    constructor() {
        this.actionsMap = {
            'AddLineItem': this.AddLineItem,
            'ChangeLineItemQuantity': this.ChangeLineItemQuantity,
            'RemoveLineItem': this.RemoveLineItem
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
                        quoteId: cartId
                    }
                },
                {
                    httpsAgent: agent,
                    headers: options.headers,
                })
            console.log(magentoResult.data)
            return magentoResult
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
        console.log('CHANGE URL ', `https://magento.test/rest/V1/guest-carts/${cartId}/items/${body.ChangeLineItemQuantity.lineItemId}`)
        try {
            const magentoResult = await axios.delete(`https://magento.test/rest/V1/guest-carts/${cartId}/items/${body.ChangeLineItemQuantity.lineItemId}`,
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

    getTotalPrice(lineItems) {
        const totalAmount = lineItems.reduce((accumulator, current) =>
            accumulator + current.price
            , 0)
        return {
            currencyCode: "USD",
            centAmount: totalAmount * 100
        }
    }
    formatMagentoCarToStorefront(magentoCar, cartId) {
        return {
            version: 0,
            customerId: null,
            lineItems: magentoCar.items,
            totalPrice: this.getTotalPrice(magentoCar.items),
            totalQuantity: magentoCar.items_qty,
            id: cartId
        }
    }
}


exports.CartController = CartController;