import React, { useState, useEffect } from 'react';
import { Wifi, Download } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { getConfig, saveConfig, downloadEnvFile } from '../../utils/config';
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

  const handleSave = () => {
    saveConfig(formData);
    onClose();
    showNotification(
      'success',
      'Configuration Saved',
      'Settings updated successfully',
      'Your database and webhook configuration has been saved. Download the .env file to update your environment variables.'
    );
    setTimeout(hideNotification, 3000);
  };

  const handleDownloadEnv = () => {
    downloadEnvFile(formData);
    showNotification(
      'success',
      'Environment File Downloaded',
      '.env file generated successfully',
      'Replace your existing .env file with the downloaded file and restart the development server.'
    );
    setTimeout(hideNotification, 4000);
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
      </div>
    </Modal>
  );
};