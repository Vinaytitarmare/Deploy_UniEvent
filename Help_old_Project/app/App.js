import {
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    useFonts
} from '@expo-google-fonts/outfit';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CustomTabBar from './src/components/CustomTabBar';
import NotificationBell from './src/components/NotificationBell';
import ScreenWrapper from './src/components/ScreenWrapper';
import { AuthProvider, useAuth } from './src/lib/AuthContext';
import { ThemeProvider, useTheme } from './src/lib/ThemeContext';
import AdminDashboard from './src/screens/AdminDashboard';
import AppearanceScreen from './src/screens/AppearanceScreen';
import AttendanceDashboard from './src/screens/AttendanceDashboard';
import AuthScreen from './src/screens/AuthScreen';
import ClubProfileScreen from './src/screens/ClubProfileScreen';
import CreateEvent from './src/screens/CreateEvent';
import EventChatScreen from './src/screens/EventChatScreen';
import EventDetail from './src/screens/EventDetail';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import MyEventsScreen from './src/screens/MyEventsScreen';
import MyRegisteredEventsScreen from './src/screens/MyRegisteredEventsScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';
import RemindersScreen from './src/screens/RemindersScreen';
import TicketScreen from './src/screens/TicketScreen';
import UserFeed from './src/screens/UserFeed';
import WalletScreen from './src/screens/WalletScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

import * as NavigationBar from 'expo-navigation-bar';

function HomeScreen({ navigation }) {
  const { user, role } = useAuth();
  const { theme, isDarkMode } = useTheme();

  useEffect(() => {
    const updateNavBar = async () => {
      // Set Android Navigation Bar Color
      await NavigationBar.setBackgroundColorAsync(theme.colors.surface);
      await NavigationBar.setButtonStyleAsync(isDarkMode ? 'light' : 'dark');
    };
    updateNavBar();
  }, [theme, isDarkMode]);

  const welcomeContent = (
    <View style={{ marginBottom: theme.spacing.m }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: theme.spacing.m }}>
        <View style={styles.userInfo}>
          <Text style={[theme.typography.h2, { color: theme.colors.text }]}>Welcome,</Text>
          <Text style={[theme.typography.h3, { color: theme.colors.text }]} numberOfLines={1}>
            {user?.displayName || 'User'}
          </Text>
          <View style={[styles.badge, { backgroundColor: theme.colors.secondary }]}>
            <Text style={styles.badgeText}>{role?.toUpperCase() || 'STUDENT'}</Text>
          </View>
        </View>
        <NotificationBell />
      </View>

      <View style={[styles.actionContainer, { marginBottom: theme.spacing.m, marginTop: theme.spacing.s }]}>
        {(role === 'admin' || role === 'club') && (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.colors.primary, ...theme.shadows.default }]}
            onPress={() => navigation.navigate('CreateEvent')}
          >
            <Text style={theme.typography.button}>+ Create Event</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <ScreenWrapper>
      <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 5 }}>
          <Text style={[styles.brandTitle, { color: theme.colors.primary }]}>UniEvent</Text>
      </View>
      <UserFeed navigation={navigation} headerContent={welcomeContent} />
      <StatusBar style={isDarkMode ? "light" : "dark"} />
    </ScreenWrapper>
  );
}

import EventAnalytics from './src/screens/EventAnalytics';

function TabNavigator() {
  const { role } = useAuth();
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // We handle icons/dots manually
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: 'Home' }}
      />

      {/* Admin Tab: Control Panel (Admin Only) */}
      {role === 'admin' && (
        <Tab.Screen
          name="AdminTab"
          component={AdminDashboard}
          options={{ title: 'Control' }}
        />
      )}

      {/* My Events Tab: For Admin & Club */}
      {(role === 'admin' || role === 'club') && (
        <Tab.Screen
          name="MyEventsTab"
          component={MyEventsScreen}
          options={{ title: 'My Events' }}
        />
      )}

      <Tab.Screen
        name="RemindersTab"
        component={RemindersScreen}
        options={{ title: 'Reminders' }}
      />

      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

function Navigation() {
  const { user, loading } = useAuth();
  const { theme } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 20, color: theme.colors.textSecondary, fontSize: 16 }}>
          Please wait...
        </Text>
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerTransparent: true,
        headerTitleStyle: {
          fontWeight: 'bold',
          color: theme.colors.text,
        },
        headerBackground: () => (
          <BlurView
            tint={theme.dark ? 'dark' : 'light'}
            intensity={80}
            style={StyleSheet.absoluteFill}
          />
        ),
        headerTintColor: theme.colors.primary,
        contentStyle: {
          backgroundColor: theme.colors.background,
        }
      }}
    >
      {user ? (
        <>
          <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="CreateEvent" component={CreateEvent} options={{ title: 'Create New Event' }} />
          <Stack.Screen name="EventDetail" component={EventDetail} options={{ title: 'Event Details' }} />
          {/* MyEvents is now a Tab, but can still be navigated to if needed, though usually via tab */}
          <Stack.Screen name="EventAnalytics" component={EventAnalytics} options={{ title: 'Analytics' }} />
          <Stack.Screen name="Leaderboard" component={LeaderboardScreen} options={{ title: 'Leaderboard' }} />
          <Stack.Screen name="EventChat" component={EventChatScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Checkout' }} />
          <Stack.Screen name="TicketScreen" component={TicketScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Wallet" component={WalletScreen} options={{ title: 'My Wallet' }} />
          <Stack.Screen name="MyRegisteredEvents" component={MyRegisteredEventsScreen} options={{ title: 'My Registered Events' }} />
          <Stack.Screen name="ClubProfile" component={ClubProfileScreen} options={{ title: 'Organization' }} />
          <Stack.Screen name="Appearance" component={AppearanceScreen} options={{ title: 'Appearance' }} />
          <Stack.Screen name="QRScanner" component={QRScannerScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AttendanceDashboard" component={AttendanceDashboard} options={{ headerShown: false }} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
}

import * as Notifications from 'expo-notifications';
import { doc, updateDoc } from 'firebase/firestore';
import { useRef } from 'react';
import { db } from './src/lib/firebaseConfig';
import { registerForPushNotificationsAsync } from './src/lib/notificationService';

export default function App() {
  const linking = {
    prefixes: [NavigationBar.documentTitle || 'exp://', 'myapp://'],
    config: {
      screens: {
        Main: {
          screens: {
            HomeTab: 'feed', // Changed from Home to HomeTab to match Tab.Screen name
            MyEventsTab: 'my-events', // Changed from MyEvents to MyEventsTab
            ProfileTab: 'profile', // Changed from Profile to ProfileTab
          },
        },
        EventDetail: 'event/:eventId',
      },
    },
  };

  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  if (!fontsLoaded) {
    return null; // Or a splash screen component
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <SafeAreaProvider>
          <NavigationContainer linking={linking}>
            <AppContent />
          </NavigationContainer>
        </SafeAreaProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const { user } = useAuth();
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (user && token) {
        // Save token to user profile
        updateDoc(doc(db, 'users', user.uid), {
          pushToken: token
        }).catch(err => console.log("Failed to save push token", err));
      }
    });

    // Listeners for foreground notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log("Notification Received:", notification);
    });

    // Listeners for user interacting with notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("Notification Tapped:", response);
      // Could navigate to event detail here
    });

    return () => {
      if (notificationListener.current) notificationListener.current.remove();
      if (responseListener.current) responseListener.current.remove();
    };
  }, [user]);

  return <Navigation />;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  userInfo: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  badgeText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 10,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
});
