const axios = require('axios').default;
const { clientId, clientSecret, CMTOOLS_API_URL, agent } = require('../constants.js');

const {CmToolsCartController} = require('./CmToolsCartController.js')
const { CmToolsController } = require('./CmToolsController.js');

class CmToolsCheckoutController {

    static async createOrder(cartId){
        const version = await CmToolsCartController.getCartVersion(cartId);
        console.log('version', version)
        const accessToken = await CmToolsController.getCmToolsAccessToken(clientId, clientSecret);
        try {
            const cartToken = await axios.post(`${CMTOOLS_API_URL}/atxel-rico-camp/orders`,
                {
                    "version": version,
                    "cart": {
                        "id":cartId,
                        "typeId":"cart"
                    }
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
            return error;
        }
    }
}
exports.CmToolsCheckoutController = CmToolsCheckoutController;