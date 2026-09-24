import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 36, 348);

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <Image
          source={require('@/assets/images/onboarding-hero.png')}
          contentFit="contain"
          style={styles.hero}
        />

        <View style={[styles.content, { width: contentWidth }]}>
          <Text style={styles.title}>Aprenda tudo de forma mais eficaz e divertida.</Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/auth/login')}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>Fazer Login</Text>
          </Pressable>

          <Text style={styles.or}>ou</Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/drawer/home')}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>Começar</Text>
          </Pressable>

          <Text style={styles.terms}>Ao continuar, você aceita nossos Termos de Uso</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#E9DFFF',
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
  },
  hero: {
    width: '100%',
    height: '52%',
    minHeight: 290,
    maxHeight: 440,
  },
  content: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    color: '#171717',
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 34,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#8A3FFC',
    borderRadius: 10,
    height: 58,
    justifyContent: 'center',
    width: '100%',
  },
  buttonPressed: {
    opacity: 0.82,
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '500',
  },
  or: {
    color: '#171717',
    fontFamily: 'Inter',
    fontSize: 11,
    marginVertical: 9,
  },
  terms: {
    color: '#171717',
    fontFamily: 'Inter',
    fontSize: 8,
    marginTop: 20,
    textAlign: 'center',
  },
});
