#!/usr/bin/env node

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Test data matching your frontend
const testData = {
  country_name: "Pakistan",
  country_ID: "1", 
  city_name: "Lahore",
  keywords: ["retail shops"]
};

// Your webhook URL - update this to match your actual URL
const webhookUrl = process.argv[2] || 'http://localhost:5678/webhook/more-areas';

function testWebhookResponse(url, data) {
  return new Promise((resolve, reject) => {
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
        timeout: 30000
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
              headers: Object.fromEntries(Object.entries(res.headers)),
              rawResponse: responseData,
              parsedResponse: jsonResponse
            });
          } catch (e) {
            resolve({
              success: false,
              status: res.statusCode,
              headers: Object.fromEntries(Object.entries(res.headers)),
              rawResponse: responseData,
              parseError: e.message
            });
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.write(postData);
      req.end();
      
    } catch (error) {
      reject(error);
    }
  });
}

function analyzeResponseStructure(response) {
  console.log('\n🔍 RESPONSE STRUCTURE ANALYSIS:');
  console.log('=====================================');
  
  if (!response.success) {
    console.log('❌ Response parsing failed:', response.parseError);
    console.log('Raw response:', response.rawResponse);
    return;
  }

  const data = response.parsedResponse;
  console.log('✅ Response parsed successfully');
  console.log('📊 Response type:', Array.isArray(data) ? 'Array' : typeof data);
  console.log('📏 Response length/size:', Array.isArray(data) ? data.length : Object.keys(data).length);
  
  if (Array.isArray(data)) {
    console.log('\n🔹 Array Analysis:');
    console.log('   • Items count:', data.length);
    
    if (data.length > 0) {
      console.log('   • First item type:', typeof data[0]);
      console.log('   • First item structure:', Object.keys(data[0]));
      
      // Check if it's areas format
      const firstItem = data[0];
      if (firstItem.name || firstItem.area_name) {
        console.log('   ✅ Looks like areas format');
      } else if (firstItem.areas && Array.isArray(firstItem.areas)) {
        console.log('   🔹 Contains nested areas array');
        console.log('   • Nested areas count:', firstItem.areas.length);
        if (firstItem.areas.length > 0) {
          console.log('   • First nested area:', Object.keys(firstItem.areas[0]));
        }
      }
    }
  } else if (typeof data === 'object') {
    console.log('\n🔹 Object Analysis:');
    console.log('   • Properties:', Object.keys(data));
    
    if (data.areas && Array.isArray(data.areas)) {
      console.log('   ✅ Has "areas" property with array');
      console.log('   • Areas count:', data.areas.length);
      if (data.areas.length > 0) {
        console.log('   • First area structure:', Object.keys(data.areas[0]));
      }
    }
  }

  console.log('\n📋 RECOMMENDED FRONTEND HANDLING:');
  console.log('=====================================');
  
  if (Array.isArray(data)) {
    if (data.length > 0 && (data[0].name || data[0].area_name)) {
      console.log('✅ Use: response directly (already an array of areas)');
    } else if (data.length > 0 && data[0].areas) {
      console.log('✅ Use: response[0].areas');
    } else {
      console.log('⚠️  Unknown array structure - check manually');
    }
  } else if (data.areas) {
    console.log('✅ Use: response.areas');
  } else {
    console.log('⚠️  Unknown structure - may need custom handling');
  }
}

async function main() {
  console.log('🚀 Testing Context Areas Webhook Response Format');
  console.log('================================================');
  console.log('📍 URL:', webhookUrl);
  console.log('📤 Request data:', JSON.stringify(testData, null, 2));
  console.log('\n⏳ Sending request...\n');

  try {
    const result = await testWebhookResponse(webhookUrl, testData);
    
    console.log('📡 RESPONSE DETAILS:');
    console.log('Status:', result.status);
    console.log('Headers:', result.headers);
    console.log('\n📝 RAW RESPONSE:');
    console.log(result.rawResponse);
    
    analyzeResponseStructure(result);
    
    console.log('\n💻 FULL PARSED RESPONSE:');
    console.log('=====================================');
    console.log(JSON.stringify(result.parsedResponse, null, 2));
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('• Check if n8n is running');
    console.log('• Verify the webhook URL');
    console.log('• Check n8n workflow logs');
  }
}

console.log('Usage: node debug-webhook-response.js [webhook-url]');
console.log('Example: node debug-webhook-response.js http://localhost:5678/webhook/more-areas\n');

main();
