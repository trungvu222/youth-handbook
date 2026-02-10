// Centralized API Configuration
// Auto-detects development vs production environment

// Check if we're in browser and on localhost
const isBrowser = typeof window !== 'undefined';
const isLocalhost = isBrowser && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === ''
);

// Auto-detect environment
const isDevelopment = process.env.NODE_ENV === 'development' || isLocalhost;

// API URL configuration
export const API_CONFIG = {
  // Base backend URL (without /api)
  BACKEND_URL: isDevelopment ? 'http://localhost:3001' : 'https://youth-handbook.onrender.com',
  
  // Full API URL (with /api)
  get API_URL() {
    return `${this.BACKEND_URL}/api`;
  },
  
  // Environment info
  isDevelopment,
  isProduction: !isDevelopment,
};

// Export for direct use
export const BACKEND_URL = API_CONFIG.BACKEND_URL;
export const API_URL = API_CONFIG.API_URL;

// Debug log in development
if (isBrowser && isDevelopment) {
  console.log('[CONFIG] Environment:', isDevelopment ? 'Development' : 'Production');
  console.log('[CONFIG] Backend URL:', BACKEND_URL);
  console.log('[CONFIG] API URL:', API_URL);
}
