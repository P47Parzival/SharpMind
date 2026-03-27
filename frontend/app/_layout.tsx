import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../global.css';
import Toast from 'react-native-toast-message';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Custom light theme with SharpMind colors
const SharpMindTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6C63FF',
    background: '#F8F9FF',
    card: '#FFFFFF',
  },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={SharpMindTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="finder"
          options={{ headerShown: false, presentation: 'fullScreenModal' }}
        />
        <Stack.Screen
          name="result"
          options={{ headerShown: false, presentation: 'modal' }}
        />
        <Stack.Screen
          name="lingo-island"
          options={{ headerShown: false, presentation: 'fullScreenModal' }}
        />
      </Stack>
      <StatusBar style="auto" />
      <Toast />
    </ThemeProvider>
  );
}
