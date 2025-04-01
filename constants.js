const https = require('https');
require('dotenv').config();

const PORT = 3030;
const USERTOKEN = 'l8ap83tvapplakurf017an8nrncl4s05';
const agent = new https.Agent({ rejectUnauthorized: false })

const options = {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${USERTOKEN}`
    }
}

const CMTOOLS_AUTH_URL = 'https://auth.us-east-2.aws.commercetools.com'
const CMTOOLS_API_URL = 'https://api.us-east-2.aws.commercetools.com'
const clientId = process.env.SOURCE === 'CMTOOLS' ? '84wYEYa3fbs08kBB9nlVnbpe' : ''
const clientSecret = process.env.SOURCE === 'CMTOOLS' ? 'AnHdO3hTWeS5rJ5faHbihMQamZpCGSqu' : ''

module.exports = {PORT,USERTOKEN,agent,options,clientId,clientSecret,CMTOOLS_API_URL,CMTOOLS_AUTH_URL}