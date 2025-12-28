import 'dotenv/config'; // Ensure env vars are loaded

export default {
    expo: {

        name: "Centralized Event Platform",
        slug: "centralized-event-platform",
        owner: "vinaykt_06",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "light",
        splash: {
            image: "./assets/splash.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff"
        },
        assetBundlePatterns: [
            "**/*"
        ],
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.hack2skill.eventloop"
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/adaptive-icon.png",
                backgroundColor: "#ffffff"
            },
            package: "com.hack2skill.eventloop"
        },
        web: {
            favicon: "./assets/favicon.png",
            bundler: "metro",
            // PWA Configuration
            name: "Event Platform",
            shortName: "EventApp",
            description: "Centralized Event Management Platform",
            themeColor: "#6200EE",
            backgroundColor: "#ffffff",
            display: "standalone",
            orientation: "portrait",
            scope: "/",
            startUrl: "/",
            // Enable service worker for offline support
            serviceWorker: {
                enabled: true
            }
        },
        plugins: [
            "expo-notifications",
            "expo-font"
        ],
        scheme: "centralized-event-platform",
        extra: {
            eas: {
                projectId: "33d70f6e-da28-48ec-9ae6-aa82ef3687fb"
            },
            firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
            firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
            firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
            firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
            firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,

            googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
            googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
            googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
            redirectUri: process.env.EXPO_PUBLIC_REDIRECT_URI,
        }
    }

};
