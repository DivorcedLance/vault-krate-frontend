// Global configuration for the application
export const APP_CONFIG = {
  // Balancer URL - Change this to point to your balancer instance
  BALANCER_URL: 'https://vault-krate-balancer-946317982825.europe-west1.run.app', //'https://vault-krate-balancer-01-946317982825.europe-west1.run.app',
  
  // API endpoints
  ENDPOINTS: {
    HEALTH_STATUS: '/health-status',
    FILES: {
      UPLOAD: '/api/files/upload',
      DOWNLOAD: '/api/files/download',
      DELETE: '/api/files/delete',
      INFO: '/api/files/info'
    }
  },
  
  // Refresh intervals (in milliseconds)
  REFRESH_INTERVALS: {
    HEALTH_CHECK: 30000, // 30 seconds
    DASHBOARD: 60000,    // 1 minute
  },
  
  // Timeouts (in milliseconds)
  TIMEOUTS: {
    API_REQUEST: 10000,  // 10 seconds
    HEALTH_CHECK: 5000,  // 5 seconds
  }
} as const;

// Helper functions to build URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${APP_CONFIG.BALANCER_URL}${endpoint}`;
};

export const getHealthStatusUrl = (): string => {
  return buildApiUrl(APP_CONFIG.ENDPOINTS.HEALTH_STATUS);
};

export const getFileApiUrl = (action: keyof typeof APP_CONFIG.ENDPOINTS.FILES): string => {
  return buildApiUrl(APP_CONFIG.ENDPOINTS.FILES[action]);
};