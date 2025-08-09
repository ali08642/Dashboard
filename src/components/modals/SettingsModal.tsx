import React, { useState, useEffect } from 'react';
import { Wifi, Download, Copy, FileText } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { getConfig, saveConfig, downloadEnvFile, generateEnvFileContent } from '../../utils/config';
import { testConnections } from '../../utils/api';
import { useApp } from '../../context/AppContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { showNotification, hideNotification } = useApp();
  const [formData, setFormData] = useState({
    supabaseUrl: '',
    supabaseKey: '',
    citiesWebhook: '',
    areasWebhook: ''
  });
  const [connectionStatus, setConnectionStatus] = useState<string>('Click "Test Connections" to verify all endpoints');
  const [statusColor, setStatusColor] = useState('#86868b');
  const [testing, setTesting] = useState(false);
  const [showEnvPreview, setShowEnvPreview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const config = getConfig();
      setFormData({
        supabaseUrl: config.supabaseUrl,
        supabaseKey: config.supabaseKey,
        citiesWebhook: config.citiesWebhook,
        areasWebhook: config.areasWebhook
      });
    }
  }, [isOpen]);

  const handleTestConnection = async () => {
    setTesting(true);
    setConnectionStatus('Testing connections...');
    setStatusColor('#86868b');

    try {
      // Temporarily save config for testing
      saveConfig(formData);
      
      const results = await testConnections();
      const tests = [];
      
      if (formData.supabaseUrl && formData.supabaseKey) {
        tests.push(`Database: ${results.database ? '✓' : '✗'}`);
      }
      if (formData.citiesWebhook) {
        tests.push(`Cities Webhook: ${results.citiesWebhook ? '✓' : '✗'}`);
      }
      if (formData.areasWebhook) {
        tests.push(`Areas Webhook: ${results.areasWebhook ? '✓' : '✗'}`);
      }

      if (tests.length === 0) {
        setConnectionStatus('⚠ No connections configured to test');
        setStatusColor('#ff9500');
      } else {
        const allSuccess = Object.values(results).every(Boolean);
        const status = tests.join(', ');
        
        if (allSuccess) {
          setConnectionStatus(`✓ All connections successful - ${status}`);
          setStatusColor('#34c759');
        } else {
          setConnectionStatus(`⚠ Some connections failed - ${status}`);
          setStatusColor('#ff3b30');
        }
      }
    } catch (error) {
      setConnectionStatus('✗ Connection test failed - Please check your configuration');
      setStatusColor('#ff3b30');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    // Save to localStorage first
    saveConfig(formData);
    
    // Automatically download the .env file
    handleDownloadEnv();
    
    onClose();
    showNotification(
      'success',
      'Configuration Saved & .env Downloaded',
      'Settings saved and .env file downloaded',
      'Your configuration has been saved. Please replace your project\'s .env file with the downloaded file and restart the development server for changes to take effect.'
    );
    setTimeout(hideNotification, 5000);
  };

  const handleDownloadEnv = () => {
    downloadEnvFile(formData);
    showNotification(
      'success',
      '.env File Downloaded',
      'Environment file ready',
      'Replace your project\'s .env file with the downloaded file and restart the development server.'
    );
    setTimeout(hideNotification, 4000);
  };

  const handleCopyEnvContent = async () => {
    const envContent = generateEnvFileContent(formData);
    try {
      await navigator.clipboard.writeText(envContent);
      showNotification(
        'success',
        'Environment Content Copied',
        'Content copied to clipboard',
        'Paste this content into your .env file and restart the development server.'
      );
      setTimeout(hideNotification, 3000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      showNotification(
        'error',
        'Copy Failed',
        'Unable to copy to clipboard',
        'Please use the Download button instead.'
      );
      setTimeout(hideNotification, 3000);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="System Configuration"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={handleTestConnection}
            loading={testing}
            icon={<Wifi className="w-4 h-4" />}
          >
            Test Connection
          </Button>
          <Button
            variant="secondary"
            onClick={handleDownloadEnv}
            icon={<Download className="w-4 h-4" />}
            title="Download new .env file to replace your current one"
          >
            Download .env
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Configuration
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <Input
          label="Supabase Project URL"
          type="url"
          value={formData.supabaseUrl}
          onChange={(e) => setFormData({ ...formData, supabaseUrl: e.target.value })}
          placeholder="https://your-project.supabase.co"
          hint="Your Supabase project URL for database operations"
        />

        <Input
          label="Supabase API Key"
          type="password"
          value={formData.supabaseKey}
          onChange={(e) => setFormData({ ...formData, supabaseKey: e.target.value })}
          placeholder="Your Supabase anon/service key"
          hint="Anon key for client operations or service key for admin operations"
        />

        <Input
          label="Cities Population Webhook URL"
          type="url"
          value={formData.citiesWebhook}
          onChange={(e) => setFormData({ ...formData, citiesWebhook: e.target.value })}
          placeholder="https://your-n8n-instance.com/webhook/populate-country"
          hint="n8n webhook endpoint for cities data population"
        />

        <Input
          label="Areas Population Webhook URL"
          type="url"
          value={formData.areasWebhook}
          onChange={(e) => setFormData({ ...formData, areasWebhook: e.target.value })}
          placeholder="https://your-n8n-instance.com/webhook/areas-endpoint"
          hint="n8n webhook endpoint for areas data population"
        />

        <div>
          <label className="block mb-2 text-sm font-medium text-[#1d1d1f] tracking-[-0.02em]">
            Connection Status
          </label>
          <div 
            className="px-4 py-3.5 bg-[rgba(0,0,0,0.03)] border border-[rgba(0,0,0,0.08)] rounded-xl text-sm"
            style={{ color: statusColor }}
          >
            {testing && <span className="inline-block w-3.5 h-3.5 border-2 border-[rgba(0,0,0,0.1)] border-t-[#0071e3] rounded-full animate-spin mr-2" />}
            {connectionStatus}
          </div>
        </div>

        {/* .env File Update Notice */}
        <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mt-0.5">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Environment File Update Required</h4>
              <p className="text-sm text-blue-800 mb-3 leading-relaxed">
                Changes will be saved locally. To apply them, you'll need to update your project's <code className="px-1.5 py-0.5 bg-blue-100 rounded text-xs font-mono">.env</code> file and restart the development server.
              </p>
              <button 
                onClick={() => setShowEnvPreview(!showEnvPreview)}
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors duration-200"
              >
                <FileText className="w-4 h-4" />
                {showEnvPreview ? 'Hide' : 'Preview'} new .env content
                <svg className={`w-4 h-4 transform transition-transform duration-200 ${showEnvPreview ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
          
          {showEnvPreview && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-blue-900">New .env file content:</span>
                <Button
                  variant="secondary"
                  onClick={handleCopyEnvContent}
                  icon={<Copy className="w-4 h-4" />}
                  className="!px-3 !py-2 !text-sm !bg-white !border-blue-200 !text-blue-700 hover:!bg-blue-50"
                >
                  Copy
                </Button>
              </div>
              <div className="bg-white rounded-lg border border-blue-200 overflow-hidden">
                <pre className="text-sm font-mono p-4 overflow-x-auto text-gray-800 leading-relaxed">
{generateEnvFileContent(formData)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};