const fetch = require('node-fetch'); // actually native fetch

async function testKlever() {
  const token = 'eyJraWQiOiIxIiwiYWxnIjoiSFMyNTYifQ.eyJ1aWQiOjQ3LCJ1dHlwaWQiOjMsImlhdCI6MTc3NTEzNjAzNiwiZXhwIjoxNzc1MTM5NjM2fQ.yAirjuJUpiIzBMVsgwp8V6iJHAP6IzRC-1Bp7owRaIc';
  const urlBase = 'https://altalayi-demo.btire.com/rest/V1/kleverapi/category-products?categoryId=5';
  
  const testCases = [
    { name: 'pattern=Turanza%20T005%20%20EXT', q: '&pattern=Turanza%20T005%20%20EXT' },
    { name: 'productGroup=4X4 and SUV', q: `&productGroup=${encodeURIComponent('4X4 and SUV')}` },
    { name: 'product_group=4X4 and SUV', q: `&product_group=${encodeURIComponent('4X4 and SUV')}` }
  ];

  for (const tc of testCases) {
    try {
      const res = await fetch(urlBase + tc.q, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      console.log(`[${tc.name}]: ${data.total_count} items`);
    } catch {}
  }
}
testKlever();
