/// <reference types="@capacitor/cli" />
/**
 * Capacitor configuration for JASAMORGAD mobile builds.
 *
 * Prerequisites (on YOUR local machine, not this cloud env):
 *   node >= 18, JDK 17, Android Studio (for Android), Xcode 15+ macOS (for iOS)
 *
 * Setup:
 *   cd /app/frontend
 *   yarn add @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
 *   yarn build
 *   npx cap init "JASAMORGAD" "id.jasamorgad.app" --web-dir=build
 *   npx cap add android
 *   npx cap add ios
 *   npx cap sync
 *
 * Open native projects:
 *   npx cap open android   # then Build > Generate Signed APK / Bundle
 *   npx cap open ios       # then Product > Archive > Distribute App
 */
const config = {
  appId: "id.jasamorgad.app",
  appName: "JASAMORGAD",
  webDir: "build",
  server: {
    // Point the mobile app to the same hosted backend
    url: "https://marketplace-hub-1550.preview.emergentagent.com",
    cleartext: false,
    androidScheme: "https",
  },
  ios: {
    contentInset: "always",
    scheme: "JASAMORGAD",
  },
  android: {
    allowMixedContent: false,
  },
  backgroundColor: "#faf8f4",
};

module.exports = config;
