import fs from 'fs';
const envFile = fs.readFileSync('.env', 'utf-8');
const BASE_URL = envFile.match(/NEXT_PUBLIC_BASE_URL=(.*)/)[1];
const TOKEN_URL = envFile.match(/MAGENTO_AUTH_TOKEN_URL=(.*)/)[1];

console.log('BASE URL:', BASE_URL);

// We need valid credentials. Can we just mock or bypass?
// Actually we don't have user's valid credentials.
// Let's just output this file.
