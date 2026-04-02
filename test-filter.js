async function testFilter() {
  const urlBase = 'https://altalayi-demo.btire.com/rest/V1/kleverapi/category-products?categoryId=5&is_ajax=1';

  const testCases = [
    { name: 'No Filter', query: '' },
    { name: 'mgs_brand string', query: '&mgs_brand=Bridgestone' },
    { name: 'brand string', query: '&brand=Bridgestone' },
    { name: 'brand array 0', query: '&brand[0]=Bridgestone' },
    { name: 'brand ID', query: '&brand=29' },
    { name: 'brand array ID', query: '&brand[0]=29' },
    { name: 'mgs_brand array ID', query: '&mgs_brand[0]=29' }
  ];

  for (const tc of testCases) {
    try {
      const res = await fetch(urlBase + tc.query, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = text; }

      if (data.total_count !== undefined) {
        console.log(`[${tc.name}] -> count: ${data.total_count}`);
        if (data.total_count < 240) {
          console.log(`SUCCESS WITH ${tc.name}!`);
        }
      } else {
        console.log(`[${tc.name}] -> Failed, response:`, typeof data === 'string' ? data.slice(0, 100) : data);
      }
    } catch (e) {
      console.log(`[${tc.name}] Error: ${e.message}`);
    }
  }
}

testFilter();
