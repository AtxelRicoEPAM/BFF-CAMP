const axios = require('axios').default;
const {agent,options} = require('../constants.js');
class CartController{

    constructor(){
        this.actionsMap = {
            'AddLineItem':this.AddLineItem,
            'ChangeLineItemQuantity':2,
            'RemoveLineItem':3,
            'SetShippingAddress':4
            }
    }
    async determineAction(requestObject){
        console.log('param ',requestObject.body.action)
        return await this.actionsMap[requestObject.body.action](requestObject.body,requestObject.params['id']);
    }

    async AddLineItem(body,cartId){
        console.log(body,'cart '+cartId)
        try{
            const magentoResult = await axios.post(`https://magento.test/rest/V1/guest-carts/${cartId}/items`,
                {
                    cartItem: {
                        sku:body.AddLineItem.variantId,
                        qty: body.AddLineItem.quantity
                    }
                },
                {
                    httpsAgent: agent,
                    headers: options.headers,
                })
                console.log(magentoResult.data)
                return magentoResult
        }catch(error){
            console.log(error.data)
            return 'Could not add item'
        }
    }

    ChangeLineItemQuantity(){}

    RemoveLineItem(){}

    getTotalPrice(lineItems){
        const totalAmount = lineItems.reduce((accumulator, current) => 
             accumulator + current.price
        ,0)
        return {
            currencyCode: "USD",
            centAmount: totalAmount*100
        }
    }

    formatMagentoCarToStorefront(magentoCar, cartId){
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