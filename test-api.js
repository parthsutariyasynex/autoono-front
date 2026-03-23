const https = require('https');
const options = {
  hostname: 'altalayi-demo.btire.com',
  path: '/rest/V1/kleverapi/my-orders?pageSize=10&currentPage=1',
  method: 'GET',
  headers: {
    'platform': 'web'
  }
};
const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => { console.log("STATUS:", res.statusCode); console.log(data); });
});
req.on('error', error => { console.error(error); });
req.end();
