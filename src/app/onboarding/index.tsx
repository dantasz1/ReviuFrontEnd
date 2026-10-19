import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    getOnboardingProgress,
    onboardingQuestions,
    saveOnboardingAnswer,
    setOnboardingQuestion,
} from '@/data/onboarding';

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const question = onboardingQuestions[questionIndex];

  useEffect(() => {
    let isActive = true;

    getOnboardingProgress().then((progress) => {
      if (!isActive) {
        return;
      }

      if (progress.completed) {
        router.replace('/auth/login');
      } else if (progress.currentQuestion >= onboardingQuestions.length) {
        router.replace('/onboarding/plan');
      } else {
        setQuestionIndex(Math.max(0, progress.currentQuestion));
        setReady(true);
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  const goBack = async () => {
    if (questionIndex === 0) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
      return;
    }

    const previousQuestion = questionIndex - 1;
    await setOnboardingQuestion(previousQuestion);
    setQuestionIndex(previousQuestion);
  };

  const chooseAnswer = async (answer: string) => {
    const nextProgress = await saveOnboardingAnswer(questionIndex, answer);

    if (nextProgress.currentQuestion >= onboardingQuestions.length) {
      router.replace('/onboarding/transition');
      return;
    }

    setQuestionIndex(nextProgress.currentQuestion);
  };

  if (!ready || !question) {
    return <View style={styles.loadingScreen} />;
  }

  const backgroundWidth = 881;
  const backgroundHeight = 1279;

  return (
    <View style={[styles.screen, { width }]}>
      <Image
        source={require('@/assets/images/onboarding/background.png')}
        contentFit="fill"
        style={[styles.background, { left: (width - backgroundWidth) / 2 }]}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable
              accessibilityLabel="Voltar"
              accessibilityRole="button"
              onPress={goBack}
              style={styles.backButton}
            >
              <Image
                source={require('@/assets/images/Left.svg')}
                contentFit="contain"
                style={styles.backIcon}
              />
            </Pressable>
            <View
              accessibilityLabel={`Pergunta ${questionIndex + 1} de ${onboardingQuestions.length}`}
              style={styles.progressTrack}
            >
              <View
                style={[
                  styles.progressFill,
                  { width: `${((questionIndex + 1) / onboardingQuestions.length) * 100}%` },
                ]}
              />
            </View>
          </View>

          <Text style={styles.title}>{question.title}</Text>

          <View style={styles.options}>
            {question.options.map((option) => (
              <Pressable
                accessibilityRole="button"
                key={option}
                onPress={() => chooseAnswer(option)}
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
              >
                <Text style={styles.optionText}>{option}</Text>
                <Image
                  source={require('@/assets/images/onboarding/forward.png')}
                  contentFit="contain"
                  style={styles.forwardIcon}
                />
              </Pressable>
            ))}
          </View>
        </ScrollView>
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
  loadingScreen: {
    backgroundColor: '#F2E8FC',
    flex: 1,
  },
  background: {
    height: 1279,
    position: 'absolute',
    top: -124,
    width: 881,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 27,
    height: 41,
    marginHorizontal: -4,
    marginTop: 0,
  },
  backButton: {
    alignItems: 'center',
    height: 41,
    justifyContent: 'center',
    width: 40,
  },
  backIcon: {
    height: 41,
    width: 40,
  },
  progressTrack: {
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    flex: 1,
    height: 6,
    marginRight: 3,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#3877FF',
    borderRadius: 3,
    height: '100%',
  },
  title: {
    color: 'rgba(0, 0, 0, 0.88)',
    fontFamily: 'Inter',
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 35,
    marginTop: 25,
    minHeight: 76,
  },
  options: {
    gap: 14,
    marginTop: 35,
  },
  option: {
    alignItems: 'center',
    backgroundColor: '#8A3FFC',
    borderRadius: 10,
    elevation: 4,
    flexDirection: 'row',
    height: 58,
    justifyContent: 'space-between',
    paddingLeft: 19,
    paddingRight: 15,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  optionPressed: {
    opacity: 0.85,
  },
  optionText: {
    color: '#FFFFFF',
    flexShrink: 1,
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '500',
  },
  forwardIcon: {
    height: 23,
    opacity: 0.5,
    width: 24,
  },
});