import { Ionicons } from '@expo/vector-icons';
import { makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential, signInWithPopup } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { auth } from '../lib/firebaseConfig';
import { useTheme } from '../lib/ThemeContext';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const { theme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp, saveAccountCredentials } = useAuth();



  // Google Auth Setup
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: Constants.expoConfig?.extra?.googleWebClientId || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    redirectUri: Constants.expoConfig?.extra?.redirectUri || process.env.EXPO_PUBLIC_REDIRECT_URI || makeRedirectUri({
      useProxy: true
    }),
    usePKCE: false,
    responseType: 'id_token',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token, access_token } = response.params;
      const { idToken, accessToken } = response.authentication || {};
      const effectiveIdToken = id_token || idToken;
      const effectiveAccessToken = accessToken || access_token;

      if (!effectiveIdToken && !effectiveAccessToken) return;

      const credential = GoogleAuthProvider.credential(effectiveIdToken || null, effectiveAccessToken || null);
      setLoading(true);
      signInWithCredential(auth, credential)
        .then((result) => saveAccountCredentials(result.user, null)) // Save Google Account
        .catch((error) => Alert.alert("Google Sign-In Error", error.message))
        .finally(() => setLoading(false));
    }
  }, [response]);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, { displayName: name });
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Platform-specific Google Sign-In handler
  const handleGoogleSignIn = async () => {
    if (Platform.OS === 'web') {
      setLoading(true);
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        await saveAccountCredentials(result.user, null); // Save Google Account
      } catch (error) {
        if (error.code !== 'auth/popup-closed-by-user') {
          Alert.alert('Google Sign-In Error', error.message);
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Native app (iOS/Android)
      promptAsync();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={[styles.brandTitle, { color: theme.colors.primary }]}>UniEvent</Text>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {isLogin ? 'Sign in to continue accessing events.' : 'Join us and start exploring amazing events.'}
          </Text>
        </View>

        <View style={styles.form}>
          {!isLogin && (
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
              <Ionicons name="person-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="Full Name"
                placeholderTextColor={theme.colors.textSecondary}
                value={name}
                onChangeText={setName}
              />
            </View>
          )}

          <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="Email Address"
              placeholderTextColor={theme.colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="Password"
              placeholderTextColor={theme.colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
            <Text style={[styles.orText, { color: theme.colors.textSecondary }]}>OR</Text>
            <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
          </View>

          <TouchableOpacity
            style={[styles.googleBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={handleGoogleSignIn}
            disabled={loading || (Platform.OS !== 'web' && !request)}
          >
            <Ionicons name="logo-google" size={20} color={theme.colors.text} />
            <Text style={[styles.googleBtnText, { color: theme.colors.text }]}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </Text>
            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
              <Text style={[styles.linkText, { color: theme.colors.primary }]}>
                {isLogin ? ' Sign Up' : ' Login'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 30,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center', // Center branding
  },
  brandTitle: {
    fontSize: 42,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 5,
    letterSpacing: 1,
  },
  title: {
    fontSize: 24, // Reduces welcome text slightly to emphasize Brand
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 56,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
    borderWidth: 0,
    outlineWidth: 0,
  },
  primaryBtn: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
  },
  orText: {
    marginHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  googleBtn: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
