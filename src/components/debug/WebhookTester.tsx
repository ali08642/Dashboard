import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { getConfig } from '../../utils/config';
import { Zap, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export const WebhookTester: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [customUrl, setCustomUrl] = useState('');

  const testWebhook = async (url: string, testData: any) => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });

      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      return {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        type: 'network_error'
      };
    }
  };

  const runTests = async () => {
    setTesting(true);
    setResults(null);

    const config = getConfig();
    const testData = {
      country_name: "Pakistan",
      country_ID: "1",
      city_name: "Lahore",
      keywords: ["test webhook"]
    };

    const tests = [];

    // Test configured webhook
    if (config.contextAreasWebhook) {
      tests.push({
        name: 'Configured Context Areas Webhook',
        url: config.contextAreasWebhook,
        result: await testWebhook(config.contextAreasWebhook, testData)
      });
    }

    // Test custom URL if provided
    if (customUrl.trim()) {
      tests.push({
        name: 'Custom Webhook URL',
        url: customUrl.trim(),
        result: await testWebhook(customUrl.trim(), testData)
      });
    }

    // Test other webhooks for comparison
    if (config.citiesWebhook) {
      tests.push({
        name: 'Cities Webhook (for comparison)',
        url: config.citiesWebhook,
        result: await testWebhook(config.citiesWebhook, { test: true })
      });
    }

    setResults({
      timestamp: new Date().toISOString(),
      config: config,
      testData: testData,
      tests: tests
    });
    setTesting(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <Zap className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Webhook Diagnostics</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Custom Webhook URL (optional)
          </label>
          <Input
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="http://localhost:5678/webhook/your-endpoint"
            className="w-full"
          />
        </div>

        <Button
          onClick={runTests}
          loading={testing}
          icon={<Zap className="w-4 h-4" />}
          className="w-full"
        >
          Run Webhook Tests
        </Button>

        {results && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Test Results</h3>
            
            {/* Configuration Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Current Configuration:</h4>
              <div className="text-sm text-gray-700 space-y-1">
                <div><strong>Context Areas:</strong> {results.config.contextAreasWebhook}</div>
                <div><strong>Cities:</strong> {results.config.citiesWebhook}</div>
                <div><strong>Areas:</strong> {results.config.areasWebhook}</div>
              </div>
            </div>

            {/* Test Results */}
            {results.tests.map((test: any, index: number) => (
              <div key={index} className={`border rounded-lg p-4 ${
                test.result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {test.result.success ? 
                    <CheckCircle className="w-5 h-5 text-green-600" /> :
                    <XCircle className="w-5 h-5 text-red-600" />
                  }
                  <h4 className="font-medium text-gray-900">{test.name}</h4>
                </div>
                
                <div className="text-sm text-gray-700 mb-2">
                  <strong>URL:</strong> {test.url}
                </div>

                {test.result.success ? (
                  <div className="text-sm text-green-700">
                    <div><strong>Status:</strong> {test.result.status} {test.result.statusText}</div>
                    <div className="mt-2">
                      <strong>Response:</strong>
                      <pre className="bg-white p-2 rounded mt-1 text-xs overflow-auto">
                        {JSON.stringify(test.result.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-red-700">
                    {test.result.type === 'network_error' ? (
                      <div>
                        <div><strong>Network Error:</strong> {test.result.error}</div>
                        <div className="mt-2 p-2 bg-red-100 rounded">
                          <AlertCircle className="w-4 h-4 inline mr-1" />
                          <strong>Possible Issues:</strong>
                          <ul className="list-disc list-inside mt-1 text-xs">
                            <li>n8n is not running</li>
                            <li>Wrong port or URL</li>
                            <li>Firewall blocking connection</li>
                            <li>CORS issues</li>
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div><strong>Status:</strong> {test.result.status} {test.result.statusText}</div>
                        <div><strong>Response:</strong> {JSON.stringify(test.result.data, null, 2)}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Copy Results Button */}
            <Button
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(results, null, 2));
                alert('Test results copied to clipboard!');
              }}
              className="w-full"
            >
              Copy Results to Clipboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
