const axios = require('axios').default;
const { agent, options } = require('../constants.js');
class CheckoutController {
    static async SetShippingAddress(body, cartId) {
        console.log(body, 'cart ' + cartId)
        const shippingMethod = await CheckoutController.getShippingMethod(cartId, body)
        console.log('SHIPPING METHOD', shippingMethod)
        const addressInfo = {
            "shipping_adress": {
                "country_id": body.SetShippingAddress.country,
                "firstname": body.SetShippingAddress.firstName,
                "lastname": body.SetShippingAddress.lastName,
                "street": [body.SetShippingAddress.streetName],
                "postcode": body.SetShippingAddress.postalCode,
                "city": body.SetShippingAddress.city,
                "region": body.SetShippingAddress.region,
                "email": body.SetShippingAddress.email,
                "telephone": body.SetShippingAddress.telephone ? body.SetShippingAddress.telephone : '3111310012'
            }
        }
        console.log('ADDRESS INFO ', {
            addressInformation: addressInfo,
            shipping_carrier_code: shippingMethod[0].carrier_code,
            shipping_method_code: shippingMethod[0].method_code
        },)
        try {
            const magentoResult = await axios.post(`https://magento.test/rest/V1/guest-carts/${cartId}/shipping-information`,
                {
                    addressInformation: {
                        shipping_address: addressInfo.shipping_adress,
                        shipping_carrier_code: shippingMethod[0].carrier_code,
                        shipping_method_code: shippingMethod[0].method_code
                    }
                },
                {
                    httpsAgent: agent,
                    headers: options.headers,
                });
            const billingAdressResult = await CheckoutController.setBillingAdress(cartId, body);
            console.log('BILLING ADDRESS RESULT ', billingAdressResult)
            console.log('ADDRESS RESULT ', magentoResult.data)
            return magentoResult.data
        } catch (error) {
            console.log(error)
            return error
        }
    }

    static async createOrder(cartId) {
        try {
            const magentoResult = await axios.put(`https://magento.test/rest/V1/guest-carts/${cartId}/order`, null,
                {
                    httpsAgent: agent,
                    headers: options.headers,
                })
            console.log('Order result', magentoResult.data)
            return magentoResult.data
        } catch (error) {
            console.log(error)
            return error
        }
    }

    static async getShippingMethod(cartId, body) {
        try {
            const magentoResult = await axios.post(`https://magento.test/rest/V1/guest-carts/${cartId}/estimate-shipping-methods`,
                {
                    address: {
                        country_id: body.SetShippingAddress.country,
                        firstname: body.SetShippingAddress.firstName,
                        lastname: body.SetShippingAddress.lastName,
                        street: [body.SetShippingAddress.streetName],
                        postcode: body.SetShippingAddress.postalCode,
                        city: body.SetShippingAddress.city,
                        region: body.SetShippingAddress.region,
                        email: body.SetShippingAddress.email
                    }
                },
                {
                    httpsAgent: agent,
                    headers: options.headers,
                })
            console.log('SHIPPING METHOD ESTIMATION ', magentoResult.data)
            return magentoResult.data
        } catch (error) {
            console.log(error.toJSON())
            return error
        }
    }

    static async setBillingAdress(cartId, body) {
        try {
            const magentoResult = await axios.post(`https://magento.test/rest/V1/guest-carts/${cartId}/set-payment-information`,
                {
                    email: body.SetShippingAddress.email,
                    paymentMethod: {
                        method: 'checkmo'
                    },
                    billingAddress: {
                        "city": body.SetShippingAddress.city,
                        "country_id": body.SetShippingAddress.country,
                        "email": body.SetShippingAddress.email,
                        "firstname": body.SetShippingAddress.firstName,
                        "lastname": body.SetShippingAddress.lastName,
                        "postcode": body.SetShippingAddress.postalCode,
                        "region": body.SetShippingAddress.region,
                        "region_code":'BER',
                        "region_id":'82',
                        "street": [body.SetShippingAddress.streetName],
                        "telephone": body.SetShippingAddress.telephone ? body.SetShippingAddress.telephone : '3111310012'
                    }

                },
                {
                    httpsAgent: agent,
                    headers: options.headers,
                })
            console.log('billing address ', magentoResult.data)
            return magentoResult.data
        } catch (error) {
            console.log(error)
            return error
        }
    }
}

exports.CheckoutController = CheckoutController;