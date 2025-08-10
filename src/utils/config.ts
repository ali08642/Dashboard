export const getConfig = (): {
  supabaseUrl: string;
  supabaseKey: string;
  citiesWebhook: string;
  areasWebhook: string;
  contextAreasWebhook: string;
} => {
  // Try to get from environment variables first
  const envConfig = {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    citiesWebhook: import.meta.env.VITE_CITIES_WEBHOOK_URL || 'http://localhost:5678/webhook/populate-country',
    areasWebhook: import.meta.env.VITE_AREAS_WEBHOOK_URL || 'http://localhost:5678/webhook/populateareas',
    contextAreasWebhook: import.meta.env.VITE_CONTEXT_AREAS_WEBHOOK_URL || 'http://localhost:5678/webhook/more-areas'
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
      areasWebhook: envConfig.areasWebhook || parsed.areasWebhook || envConfig.areasWebhook,
      contextAreasWebhook: envConfig.contextAreasWebhook || parsed.contextAreasWebhook || envConfig.contextAreasWebhook
    };
  }

  return envConfig;
};

export const saveConfig = (config: {
  supabaseUrl: string;
  supabaseKey: string;
  citiesWebhook: string;
  areasWebhook: string;
  contextAreasWebhook: string;
}) => {
  localStorage.setItem('leadgen_config', JSON.stringify(config));
};

export const generateEnvFileContent = (config: {
  supabaseUrl: string;
  supabaseKey: string;
  citiesWebhook: string;
  areasWebhook: string;
  contextAreasWebhook: string;
}): string => {
  return `# Supabase Configuration
VITE_SUPABASE_URL=${config.supabaseUrl}
VITE_SUPABASE_ANON_KEY=${config.supabaseKey}

# Webhook Configuration
VITE_CITIES_WEBHOOK_URL=${config.citiesWebhook}
VITE_AREAS_WEBHOOK_URL=${config.areasWebhook}
VITE_CONTEXT_AREAS_WEBHOOK_URL=${config.contextAreasWebhook}
`;
};

export const downloadEnvFile = (config: {
  supabaseUrl: string;
  supabaseKey: string;
  citiesWebhook: string;
  areasWebhook: string;
  contextAreasWebhook: string;
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