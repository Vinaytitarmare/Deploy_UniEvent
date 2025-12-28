import Constants from 'expo-constants';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

const extra = Constants.expoConfig?.extra || {};

const firebaseConfig = {
  apiKey: extra.firebaseApiKey || process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: extra.firebaseAuthDomain || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: extra.firebaseProjectId || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: extra.firebaseStorageBucket || process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: extra.firebaseMessagingSenderId || process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: extra.firebaseAppId || process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize App
const app = initializeApp(firebaseConfig);

// Initialize Auth (default persistence for web)
export const auth = getAuth(app);

// Initialize Firestore with Offline Persistence
let db;
if (Platform.OS === 'web') {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  });
} else {
  // Native (iOS/Android) has persistence enabled by default
  db = getFirestore(app);
}
export { db };
export const functions = getFunctions(app);
export const storage = getStorage(app);

export default app;
