async function testKlever() {
  const token = 'eyJraWQiOiIxIiwiYWxnIjoiSFMyNTYifQ.eyJ1aWQiOjQ3LCJ1dHlwaWQiOjMsImlhdCI6MTc3NTEzNjAzNiwiZXhwIjoxNzc1MTM5NjM2fQ.yAirjuJUpiIzBMVsgwp8V6iJHAP6IzRC-1Bp7owRaIc';

  const urlBase = 'https://altalayi-demo.btire.com/rest/V1/kleverapi/category-products?categoryId=5';

  const testCases = [
    { name: 'mgs_brand=Bridgestone', q: '&mgs_brand=Bridgestone' },
    { name: 'mgs_brand_encode', q: '&mgs_brand=' + encodeURIComponent('Bridgestone') },
    { name: 'brand=Bridgestone', q: '&brand=Bridgestone' },
    { name: 'mgs_brand=29', q: '&mgs_brand=29' },
    { name: 'brand=29', q: '&brand=29' },
    { name: 'brand=54', q: '&brand=54' },
    { name: 'brand=Bridgestone array', q: '&brand[0]=Bridgestone' },
    { name: 'mgs_brand=Bridgestone array', q: '&mgs_brand[0]=Bridgestone' },
    { name: 'brand id array', q: '&brand[0]=29' },
    { name: 'search filter', q: '&searchCriteria[filter_groups][0][filters][0][field]=brand&searchCriteria[filter_groups][0][filters][0][value]=Bridgestone' },
    { name: 'search filter ID', q: '&searchCriteria[filter_groups][0][filters][0][field]=brand&searchCriteria[filter_groups][0][filters][0][value]=29' },
    { name: 'search filter mgs_brand ID', q: '&searchCriteria[filter_groups][0][filters][0][field]=mgs_brand&searchCriteria[filter_groups][0][filters][0][value]=29' }
  ];

  for (const tc of testCases) {
    try {
      const res = await fetch(urlBase + tc.q, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      console.log(`[${tc.name}]: ${data.total_count} items`);
      if (data.total_count < 240) {
        console.log(`*** SUCCESS FILTER! ${tc.name} gave ${data.total_count} items ***`);
      }
    } catch (e) {
      console.log(`[${tc.name}] Error...`);
    }
  }
}
testKlever();
