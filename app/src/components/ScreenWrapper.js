import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../lib/ThemeContext';

export default function ScreenWrapper({ children, style, edges = ['top', 'left', 'right', 'bottom'] }) {
  const { theme } = useTheme();
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={edges}>
      <View style={[styles.container, { paddingHorizontal: theme.spacing.m }, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
});
