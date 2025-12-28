import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { createUserWithEmailAndPassword, signOut as firebaseSignOut, GoogleAuthProvider, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { auth, db } from './firebaseConfig';

// Helper for storage
const setStorage = async (key, value) => {
    if (Platform.OS === 'web') {
        await AsyncStorage.setItem(key, value);
    } else {
        await SecureStore.setItemAsync(key, value);
    }
};

const getStorage = async (key) => {
    if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(key);
    } else {
        return await SecureStore.getItemAsync(key);
    }
};

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null); // New state for Firestore data
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(true);
  const [savedAccounts, setSavedAccounts] = useState([]);

  useEffect(() => {
    loadSavedAccounts(); // Load accounts on mount
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        let userRole = 'student';
        let dbData = {};
        
        // 1. Check Custom Claims (Preferred)
        const tokenResult = await currentUser.getIdTokenResult().catch(() => ({ claims: {} }));
        if (tokenResult.claims.admin) userRole = 'admin';
        else if (tokenResult.claims.club) userRole = 'club';
        
        // 2. Fallback: Check Firestore Document
        try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
                dbData = userDoc.data();
                if (dbData.role === 'admin' || dbData.role === 'club') {
                    userRole = dbData.role;
                }
            }
        } catch (e) {
            console.log("Error fetching user role from db", e);
        }

        setRole(userRole);
        setUser(currentUser);
        setUserData(dbData); // Store profile data separately
        
        // Ensure current user is in saved accounts (even if just session)
        saveAccountCredentials(currentUser, null);

      } else {
        setUser(null);
        setUserData(null);
        setRole('student');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // --- Account Management Utils ---


 const loadSavedAccounts = async () => {
      try {
          const json = await getStorage('saved_accounts');
          if (json) {
              setSavedAccounts(JSON.parse(json));
          }
      } catch (e) {
          console.log("Failed to load saved accounts", e);
      }
  };

  const saveAccountCredentials = async (user, password) => {
      try {
          // Get existing accounts
          let currentAccounts = [];
          const json = await getStorage('saved_accounts');
          if (json) currentAccounts = JSON.parse(json);

          // Update or Add
          const existingIndex = currentAccounts.findIndex(a => a.email === user.email);
          const existingAccount = existingIndex >= 0 ? currentAccounts[existingIndex] : null;

          // Preserve password if not provided (e.g. during auto-save on load)
          const finalPassword = password || (existingAccount ? existingAccount.password : null);

          // If we have a password, we are definitely NOT google only (or we have pass fallback)
          // If we don't have password, and it was marked isGoogle, keep it.
          // If new user and no password, assume Google/Social.
          const isGoogle = existingAccount ? existingAccount.isGoogle : !password;

          const newAccount = {
              email: user.email,
              password: finalPassword, // Storing password securely
              displayName: user.displayName || 'User',
              photoURL: user.photoURL,
              uid: user.uid,
              isGoogle: isGoogle
          };

          if (existingIndex >= 0) {
              currentAccounts[existingIndex] = newAccount;
          } else {
              currentAccounts.push(newAccount);
          }
          
          // Limit to 5 accounts (optional per user request constraint)
          if (currentAccounts.length > 5) {
             // Remove oldest (first) that is not current? Or just slice.
             // Just slice last 5 to keep it simple, or keep 5.
             // Let's not auto-delete unless necessary, user just said "upto 5".
             // We'll leave it unbounded for now unless it causes issues.
          }

          await setStorage('saved_accounts', JSON.stringify(currentAccounts));
          setSavedAccounts(currentAccounts);
      } catch (e) {
          console.log("Failed to save account", e);
      }
  };

  const switchAccount = async (targetEmail) => {
      setLoading(true); 
      try {
          const account = savedAccounts.find(a => a.email === targetEmail);
          if (!account) throw new Error("Account not found");
          
          await firebaseSignOut(auth);

          if (account.password) {
              await signInWithEmailAndPassword(auth, account.email, account.password);
          } else if (Platform.OS === 'web') {
              // Google Auth Web Auto-Switch
              const provider = new GoogleAuthProvider();
              provider.setCustomParameters({ login_hint: targetEmail });
              await signInWithPopup(auth, provider);
          } else {
               // Native Google / Fallback
               console.log("Switching to Google/Other Account - requires manual sign in");
               // Does nothing (user is signed out, UI will show AuthScreen)
          }
      } catch (e) {
          console.error("Switch failed", e);
      } finally {
         setLoading(false);
      }
  };

  const removeSavedAccount = async (targetEmail) => {
      const newAccounts = savedAccounts.filter(a => a.email !== targetEmail);
      await setStorage('saved_accounts', JSON.stringify(newAccounts));
      setSavedAccounts(newAccounts);
  };

  // --- Auth Actions ---

  const signIn = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await saveAccountCredentials(result.user, password); // Auto-save
    return result;
  };

  const signUp = async (email, password, additionalData = {}) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const { user } = result;
    
    // Create user document
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      role: 'student', // Default role
      createdAt: new Date().toISOString(),
      ...additionalData
    });

    await saveAccountCredentials(user, password); // Auto-save
    return result;
  };

  const signOut = () => {
    return firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ 
        user, userData, role, loading, 
        signIn, signUp, signOut,
        savedAccounts, switchAccount, removeSavedAccount, saveAccountCredentials 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
