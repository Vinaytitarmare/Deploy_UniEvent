import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// ------------------------------------------------------------
// 1. PALETTE: Premium, High-Contrast, Vibrant
// ------------------------------------------------------------
const palette = {
  // Brand
  primary: '#FF6D00',      // Deep Orange (Vibrant)
  primaryGradient: ['#FF6D00', '#FFAB00'], // Orange -> Amber
  secondary: '#FFD600',    // Bright Yellow
  accent: '#2979FF',       // Blue for contrast (Info/Links)

  // Neutrals - Light
  light: {
    background: '#F8F9FA',
    surface: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#6C757D',
    border: '#E9ECEF',
    glass: 'rgba(255, 255, 255, 0.7)',
    glassBorder: 'rgba(255, 255, 255, 0.5)',
  },

  // Neutrals - Dark (Deep Space)
  dark: {
    background: '#0F0F13', // Deep Void
    surface: '#1E1E24',
    text: '#FFFFFF',
    textSecondary: '#A0A0B0',
    border: '#2D2D3A',
    glass: 'rgba(30, 30, 36, 0.7)', // Dark Glass
    glassBorder: 'rgba(255, 255, 255, 0.1)',
  },

  // Status
  success: '#00E676',
  error: '#FF5252',
  warning: '#FFB74D',
};

// ------------------------------------------------------------
// 2. TYPOGRAPHY: 'Outfit' (Modern, Geometric)
// ------------------------------------------------------------
// Note: Requires @expo-google-fonts/outfit loaded in App.js
const typography = {
  h1: { fontFamily: 'Outfit_700Bold', fontSize: 32, lineHeight: 40, letterSpacing: -1 },
  h2: { fontFamily: 'Outfit_700Bold', fontSize: 24, lineHeight: 32, letterSpacing: -0.5 },
  h3: { fontFamily: 'Outfit_600SemiBold', fontSize: 20, lineHeight: 28 },
  body: { fontFamily: 'Outfit_400Regular', fontSize: 16, lineHeight: 24 },
  bodySmall: { fontFamily: 'Outfit_400Regular', fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: 'Outfit_500Medium', fontSize: 12, lineHeight: 16, textTransform: 'uppercase', letterSpacing: 1 },
  button: { fontFamily: 'Outfit_700Bold', fontSize: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
};

// ------------------------------------------------------------
// 3. SHADOWS & GLASS (Elevation)
// ------------------------------------------------------------
const shadows = {
  light: {
    default: {
      shadowColor: '#FF6D00', // Orange Shadow
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    hover: {
      shadowColor: '#FFAB00', // Amber Shadow
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
    },
  },
  dark: {
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 10,
    },
    hover: {
      shadowColor: '#FF6D00', // Orange Glow
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2, // Reduced opacity
      shadowRadius: 8,
      elevation: 5,
    },
  },
};

// ------------------------------------------------------------
// 4. THEME EXPORTS
// ------------------------------------------------------------
export const lightTheme = {
  dark: false,
  colors: {
    ...palette.light,
    primary: palette.primary,
    primaryGradient: palette.primaryGradient,
    secondary: palette.secondary,
    accent: palette.accent,
    error: palette.error,
    success: palette.success,
    warning: palette.warning,
  },
  typography,
  shadows: shadows.light,
  spacing: { s: 8, m: 16, l: 24, xl: 32, xxl: 48 },
  layout: { width, height },
};

export const darkTheme = {
  dark: true,
  colors: {
    ...palette.dark,
    primary: palette.primary,
    primaryGradient: palette.primaryGradient,
    secondary: palette.secondary,
    accent: palette.accent,
    error: palette.error,
    success: palette.success,
    warning: palette.warning,
  },
  typography,
  shadows: shadows.dark,
  spacing: { s: 8, m: 16, l: 24, xl: 32, xxl: 48 },
  layout: { width, height },
};

export const theme = lightTheme;
