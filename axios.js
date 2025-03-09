const { USERTOKEN } = require('./constants.js')
const axios = require('axios').default;
const https = require('https')
const {Formater} = require('./categories/Formatter.js')


console.log(`token: ${USERTOKEN}`)
const options = {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${USERTOKEN}`,
        'rejectUnauthorized': false
    }
}
const agent = new https.Agent({ rejectUnauthorized: false })
const category = 23;
/* axios.get(`http://localhost:80/rest/default/V1/products?searchCriteria[filterGroups][0][filters][0][field]=category_id&searchCriteria[filterGroups][0][filters][0][value]=${category}&searchCriteria[filterGroups][0][filters][0][conditionType]=eq&searchCriteria[currentPage]=1&searchCriteria[pageSize]=10`,
    {
        httpsAgent: agent,
        headers: options.headers
    })
    .then((result) => {
        console.log(result.data)
    }
    )
    .catch(function (error) {
        console.log(error)
    })
 */
class test {
    static async findColorLabelByValue(value) {
    try {
        const label = await axios.get('https://magento.test/rest/V1/products/attributes/color',
            {
                httpsAgent: agent,
                headers: options.headers,
            }
        );
        console.log('LABEL TIPO ATX ' + label.status)
        return label.data.options.find((Element) => Element.value === value).label;
    } catch (error) {
        console.log(error)
    }
    }

    static async getVariantsFromMagento(ids) {
                try {
                    const result = await axios.get(
                        `http://magento.test/rest/V1/products?searchCriteria[filterGroups][0][filters][0][field]=entity_id&searchCriteria[filterGroups][0][filters][0][value]=${ids}&searchCriteria[filterGroups][0][filters][0][conditionType]=in`,
                        {
                            httpsAgent: agent,
                            headers: options.headers,
                        }
                    );
                    const formated =await Formater.transformMagentoProductsToStorefront(result.data['items'])
                    console.log({
                        results: formated,
                        total_count: result.data['items'].length,
                    });
                    
                    return {
                        results: formated,
                        total_count: result.data['items'].length,
                    };
                } catch (error) {
                    console.log('error', error);
                    // Explicit error handling
                    throw error; // or return an error object as needed
                }
            }

    static async getColor(){
        const a = await test.findColorLabelByValue('60')
        console.log(a)
    }

    static async getList(){
        const a = await test.getVariantsFromMagento('23,12,4,21')
        console.log(a)
    }

}

test.getList()