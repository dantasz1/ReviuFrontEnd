import { getOnboardingProgress, onboardingQuestions } from '@/data/onboarding';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 40, 360);

  useEffect(() => {
    getOnboardingProgress().then((progress) => {
      if (progress.completed) {
        router.replace('/auth/login');
      }
    });
  }, []);

  const startOnboarding = async () => {
    const progress = await getOnboardingProgress();

    if (progress.completed) {
      router.push('/auth/login');
    } else if (progress.currentQuestion >= onboardingQuestions.length) {
      router.push('/onboarding/plan');
    } else {
      router.push('/onboarding' as Href);
    }
  };

  return (
    <View style={styles.screen}>
      <Image
        source={require('@/assets/images/onboarding-background.png')}
        contentFit="contain"
        style={styles.backgroundShape}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={[styles.layout, { width: contentWidth }]}>
          <LottieView
            source={require('@/assets/lotties/Exam Preparation.json')}
            autoPlay
            loop
            style={styles.hero}
          />

          <View style={styles.content}>
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
              onPress={startOnboarding}
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            >
              <Text style={styles.buttonText}>Começar</Text>
            </Pressable>

            <Text style={styles.terms}>Ao continuar, você aceita nossos Termos de Uso</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundShape: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    aspectRatio: 390 / 570,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  layout: {
    alignItems: 'center',
    gap: 12,
  },
  hero: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 360,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    color: '#171717',
    fontFamily: 'Inter',
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 44,
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
    fontSize: 14,
    marginVertical: 9,
  },
  terms: {
    color: '#171717',
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 18,
    marginTop: 20,
    textAlign: 'center',
  },
});
