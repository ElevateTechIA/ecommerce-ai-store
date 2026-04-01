export const featureFlags = {
  AI_ENABLED: process.env.NEXT_PUBLIC_AI_ENABLED === 'true',
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:4000',
  AI_API_KEY: process.env.AI_SERVICE_API_KEY || '',
};
