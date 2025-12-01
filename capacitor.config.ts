import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.youthhandbook.app',
  appName: 'Youth Handbook',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    hostname: 'localhost',
    iosScheme: 'capacitor'
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
