const axios = require('axios').default;
const { agent, options } = require('../constants.js');
class CheckoutController{
    static async SetShippingAddress(body,cartId){
        console.log(body, 'cart ' + cartId)
        const region = CheckoutController.searchRegionArrayByName(await CheckoutController.getRegionInfoByCountry(body.SetShippingAddress.country));
        try {
            const magentoResult = await axios.post(`https://magento.test/rest/V1/guest-carts/${cartId}/shipping-information`,
                {
                    addressInformation: {
                        city:body.SetShippingAddress.city,
                        country_id:body.SetShippingAddress.country,
                        email:body.SetShippingAddress.email,
                        firstname:body.SetShippingAddress.firstName,
                        lastname:body.SetShippingAddress.lastName,
                        postcode:body.SetShippingAddress.postalCode,
                        region:body.SetShippingAddress.region,
                        region_code:region.code,
                        region_id:region.id,
                        street:body.SetShippingAddress.streetName,
                        telephone:"",
                        shipping_carrier_code:null,
                        shipping_method_code:null

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

    static async getRegionInfoByCountry(countryCode){
        try {
            const magentoResult = await axios.get(`https://magento.test/rest/V1/directory/countries/${countryCode}`,
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

    static searchRegionArrayByName(regionName, regions){
        return regions.find((element) => 
            element.name === regionName
        );
    }
   
}

exports.CheckoutController = CheckoutController;