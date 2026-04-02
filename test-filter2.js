async function testFilter() {
  const urlBase = 'https://altalayi-demo.btire.com/rest/V1/kleverapi/category-products?categoryId=5';
  
  // What if KleverAPI accepts JSON encoded filter array?
  const testCases = [
    { name: 'mgs_brand=29', query: '&mgs_brand=29' },
    { name: 'mgs_brand=231', query: '&mgs_brand=231' } // From earlier 231 option ID?
  ];

  for (const tc of testCases) {
    try {
      const res = await fetch(urlBase + tc.query);
      const text = await res.text();
      let data = JSON.parse(text);
      if (data.total_count !== undefined) {
        console.log(`[${tc.name}] -> count: ${data.total_count}`);
      } else {
        console.log(`[${tc.name}] -> wait, no total_count`);
      }
    } catch {}
  }
}
testFilter();
