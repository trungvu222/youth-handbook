import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.youthhandbook.app',
  appName: 'Youth Handbook',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
