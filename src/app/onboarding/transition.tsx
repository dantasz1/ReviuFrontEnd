import { Image } from 'expo-image';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingTransitionScreen() {
  useEffect(() => {
    const timeout = setTimeout(() => router.replace('/onboarding/plan'), 1800);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.screen}>
      <Image
        source={require('@/assets/images/onboarding/background.png')}
        contentFit="fill"
        style={styles.background}
      />
      <SafeAreaView style={styles.content} edges={['top', 'bottom']}>
        <Text style={styles.title}>Analisando seu perfil de estudo...</Text>
        <LottieView
          source={require('@/assets/lotties/AI.json')}
          autoPlay
          loop
          style={styles.analysis}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F2E8FC',
    flex: 1,
    overflow: 'hidden',
  },
  background: {
    height: 1279,
    left: '50%',
    marginLeft: -440.5,
    position: 'absolute',
    top: -124,
    width: 881,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    color: 'rgba(0, 0, 0, 0.88)',
    fontFamily: 'Inter',
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 35,
    marginTop: 65,
  },
  analysis: {
    alignSelf: 'center',
    height: 293,
    marginTop: 95,
    width: 167,
  },
});