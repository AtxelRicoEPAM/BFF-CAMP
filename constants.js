const https = require('https');

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

module.exports = {PORT,USERTOKEN,agent,options}