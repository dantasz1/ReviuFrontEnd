import { Image } from 'expo-image';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { completeOnboarding } from '@/data/onboarding';

export default function OnboardingPlanScreen() {
  const savePlan = async () => {
    await completeOnboarding();
    router.push('/auth/signup');
  };

  return (
    <View style={styles.screen}>
      <Image
        source={require('@/assets/images/onboarding/background.png')}
        contentFit="fill"
        style={styles.background}
      />
      <SafeAreaView style={styles.content} edges={['top', 'bottom']}>
        <Text style={styles.title}>Seu plano personalizado de estudos está pronto.</Text>
        <LottieView
          source={require('@/assets/lotties/graph.json')}
          autoPlay
          loop
          style={styles.chart}
        />
        <Pressable
          accessibilityRole="button"
          onPress={savePlan}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Salvar meu plano e criar conta</Text>
        </Pressable>
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
  chart: {
    alignSelf: 'center',
    height: 220,
    marginTop: 96,
    width: 298,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#8A3FFC',
    borderRadius: 10,
    height: 58,
    justifyContent: 'center',
    marginBottom: 47,
    marginTop: 'auto',
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
});