export const getConfig = (): {
  supabaseUrl: string;
  supabaseKey: string;
  citiesWebhook: string;
  areasWebhook: string;
} => {
  // Try to get from environment variables first
  const envConfig = {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    citiesWebhook: import.meta.env.VITE_CITIES_WEBHOOK_URL || 'https://your-n8n.com/webhook/populate-country',
    areasWebhook: import.meta.env.VITE_AREAS_WEBHOOK_URL || 'https://your-n8n.com/webhook/3cbf8c56-f36c-4375-b211-bfac8c1d4e9a'
  };

  // If environment variables are not set, try localStorage
  const savedConfig = localStorage.getItem('leadgen_config');
  if (savedConfig && (!envConfig.supabaseUrl || !envConfig.supabaseKey)) {
    const parsed = JSON.parse(savedConfig);
    return {
      ...envConfig,
      supabaseUrl: envConfig.supabaseUrl || parsed.supabaseUrl || '',
      supabaseKey: envConfig.supabaseKey || parsed.supabaseKey || '',
      citiesWebhook: envConfig.citiesWebhook || parsed.citiesWebhook || envConfig.citiesWebhook,
      areasWebhook: envConfig.areasWebhook || parsed.areasWebhook || envConfig.areasWebhook
    };
  }

  return envConfig;
};

export const saveConfig = (config: {
  supabaseUrl: string;
  supabaseKey: string;
  citiesWebhook: string;
  areasWebhook: string;
}) => {
  localStorage.setItem('leadgen_config', JSON.stringify(config));
};

export const generateEnvFileContent = (config: {
  supabaseUrl: string;
  supabaseKey: string;
  citiesWebhook: string;
  areasWebhook: string;
}): string => {
  return `# Supabase Configuration
VITE_SUPABASE_URL=${config.supabaseUrl}
VITE_SUPABASE_ANON_KEY=${config.supabaseKey}

# Webhook Configuration
VITE_CITIES_WEBHOOK_URL=${config.citiesWebhook}
VITE_AREAS_WEBHOOK_URL=${config.areasWebhook}
`;
};

export const downloadEnvFile = (config: {
  supabaseUrl: string;
  supabaseKey: string;
  citiesWebhook: string;
  areasWebhook: string;
}) => {
  const content = generateEnvFileContent(config);
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = '.env';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};