import Constants from 'expo-constants';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { initializeAuth, getAuth, inMemoryPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import 'firebase/auth';

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

// Initialize Auth - forcing in-memory for SDK 54 debugging
let auth;
try {
    auth = initializeAuth(app, {
        persistence: inMemoryPersistence
    });
} catch (error) {
    console.error("Firebase initializeAuth failed (in-memory):", error);
    auth = getAuth(app);
}

export { auth };

// Initialize other services
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);

export default app;
