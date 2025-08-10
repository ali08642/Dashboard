#!/usr/bin/env node

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Test data
const testData = {
  country_name: "Pakistan",
  country_ID: "1", 
  city_name: "Lahore",
  keywords: ["retail shops", "test"]
};

// Default URLs to test (you can modify these)
const webhookUrls = [
  'http://localhost:5678/webhook/more-areas',
  'http://localhost:5678/webhook/populateareas', 
  'http://localhost:5678/webhook/populate-country'
];

function testWebhook(url, data) {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url);
      const postData = JSON.stringify(data);
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 10000
      };

      const client = urlObj.protocol === 'https:' ? https : http;
      
      const req = client.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonResponse = JSON.parse(responseData);
            resolve({
              success: true,
              status: res.statusCode,
              statusMessage: res.statusMessage,
              data: jsonResponse,
              url: url
            });
          } catch (e) {
            resolve({
              success: res.statusCode < 400,
              status: res.statusCode,
              statusMessage: res.statusMessage,
              data: responseData,
              url: url
            });
          }
        });
      });
      
      req.on('error', (error) => {
        resolve({
          success: false,
          error: error.message,
          url: url,
          type: 'connection_error'
        });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({
          success: false,
          error: 'Request timeout',
          url: url,
          type: 'timeout'
        });
      });
      
      req.write(postData);
      req.end();
      
    } catch (error) {
      resolve({
        success: false,
        error: error.message,
        url: url,
        type: 'url_error'
      });
    }
  });
}

async function runTests() {
  console.log('🔄 Testing n8n Webhooks...\n');
  console.log('Test Data:', JSON.stringify(testData, null, 2));
  console.log('\n' + '='.repeat(50) + '\n');
  
  for (const url of webhookUrls) {
    console.log(`Testing: ${url}`);
    const result = await testWebhook(url, testData);
    
    if (result.success) {
      console.log('✅ SUCCESS');
      console.log(`   Status: ${result.status} ${result.statusMessage}`);
      console.log(`   Response:`, typeof result.data === 'object' ? JSON.stringify(result.data, null, 2) : result.data);
    } else {
      console.log('❌ FAILED');
      console.log(`   Error: ${result.error}`);
      if (result.status) {
        console.log(`   Status: ${result.status} ${result.statusMessage}`);
      }
      
      // Helpful suggestions
      if (result.type === 'connection_error') {
        console.log('   💡 Suggestions:');
        console.log('      • Check if n8n is running');
        console.log('      • Verify the port number');
        console.log('      • Check firewall settings');
      }
    }
    console.log('\n' + '-'.repeat(30) + '\n');
  }
  
  console.log('🏁 Testing complete!');
  console.log('\n💡 To test a custom URL, run:');
  console.log('   node test-webhook.js http://your-custom-url');
}

// Allow custom URL as command line argument
const customUrl = process.argv[2];
if (customUrl) {
  console.log(`🔄 Testing custom URL: ${customUrl}\n`);
  testWebhook(customUrl, testData).then(result => {
    if (result.success) {
      console.log('✅ SUCCESS');
      console.log(`Status: ${result.status} ${result.statusMessage}`);
      console.log(`Response:`, JSON.stringify(result.data, null, 2));
    } else {
      console.log('❌ FAILED');
      console.log(`Error: ${result.error}`);
    }
  });
} else {
  runTests();
}
