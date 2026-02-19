
const https = require('https');

const token = 'vaojuu2uNboDzmhHXP6Sjg';
const baseUrl = 'https://brapi.dev/api';

async function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    console.error('Error parsing JSON for URL:', url, data.substring(0, 100));
                    resolve({});
                }
            });
        }).on('error', reject);
    });
}

async function run() {
    try {
        console.log('Fetching Top Volume Stocks...');
        // 1. Get Top Volume
        const volumeUrl = `${baseUrl}/quote/list?sortBy=volume&sortOrder=desc&limit=20&token=${token}`;
        const volData = await fetchJson(volumeUrl);

        if (!volData.stocks) {
            console.error('No stocks found in volume list');
            return;
        }

        const tickers = volData.stocks.map(s => s.stock);
        console.log('Tickers found:', tickers.join(','));

        // 2. Fetch Details in Chunks of 10
        const chunkSize = 10;
        const chunks = [];
        for (let i = 0; i < tickers.length; i += chunkSize) {
            chunks.push(tickers.slice(i, i + chunkSize));
        }

        console.log(`Fetching details in ${chunks.length} chunks...`);

        for (const chunk of chunks) {
            const url = `${baseUrl}/quote/${chunk.join(',')}?modules=defaultKeyStatistics&token=${token}`;
            console.log(`Requesting: ${url}`);
            const details = await fetchJson(url);

            if (details.results) {
                console.log(`Chunk success. Got ${details.results.length} results.`);
                details.results.forEach(r => {
                    const dy = r.defaultKeyStatistics ? r.defaultKeyStatistics.dividendYield : 'N/A';
                    console.log(`${r.symbol}: DY = ${dy}%`);
                });
            } else {
                console.error('Chunk failed or no results:', details);
            }
        }

    } catch (error) {
        console.error('Script error:', error);
    }
}

run();
