
const https = require('https');

const token = 'vaojuu2uNboDzmhHXP6Sjg';
const url = `https://brapi.dev/api/quote/BBAS3?token=${token}&modules=defaultKeyStatistics`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('Raw JSON:', JSON.stringify(json, null, 2));
            if (json.results && json.results[0] && json.results[0].defaultKeyStatistics) {
                console.log('Dividend Yield:', json.results[0].defaultKeyStatistics.dividendYield);
            }
        } catch (e) {
            console.error('Error parsing JSON:', e);
            console.log('Raw Data:', data);
        }
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
