import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { Platform, StyleSheet, useColorScheme, View } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={[styles.appFrame, Platform.OS === 'web' && styles.webFrame]}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  appFrame: {
    flex: 1,
    width: '100%',
  },
  webFrame: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    maxWidth: 480,
  },
});
