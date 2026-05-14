
const magentoUrl = 'https://autoono-demo.btire.com/rest/en/V1/kleverapi/my-account';
const token = 'test-token';

async function test() {
    try {
        console.log(`Fetching ${magentoUrl}...`);
        const start = Date.now();
        const response = await fetch(magentoUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'platform': 'web',
            },
        });
        const end = Date.now();
        console.log(`Status: ${response.status} in ${end - start}ms`);
    } catch (error) {
        console.error('Fetch failed:', error);
    }
}

test();
