import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.youthhandbook.app',
  appName: 'Youth Handbook',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    hostname: 'localhost',
    iosScheme: 'capacitor',
    // Allow connections to backend API
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    // Allow HTTP connections for development
    webContentsDebuggingEnabled: true
  },
  plugins: {
    // Enable keyboard handling
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  }
};

export default config;
