import AsyncStorage from '@react-native-async-storage/async-storage';

export type OnboardingQuestion = {
	id: string;
	title: string;
	options: string[];
};

export type OnboardingProgress = {
	answers: Record<string, string>;
	currentQuestion: number;
	completed: boolean;
};

const STORAGE_KEY = '@reviu/onboarding';

export const onboardingQuestions: OnboardingQuestion[] = [
	{
		id: 'focus',
		title: 'Qual foco dos seus estudos?',
		options: ['Vestibular / ENEM', 'Concursos Públicos', 'Idiomas', 'Faculdade', 'Aprendizado geral'],
	},
	{
		id: 'deadline',
		title: 'Qual seu prazo final?',
		options: ['Próximos 3 meses', 'Entre 3 e 12 meses', 'Sem prazo fixo / Longo prazo'],
	},
	{
		id: 'dailyGoal',
		title: 'Qual sua meta diária de estudos?',
		options: ['10 minutos', '30 minutos', '1 hora', 'Mais de 1 hora'],
	},
	{
		id: 'focusTime',
		title: 'Qual seu horário de maior foco?',
		options: ['Manhã', 'Tarde', 'Noite', 'Flexível'],
	},
	{
		id: 'learningStyle',
		title: 'Como você lida com conteúdos novos?',
		options: ['Esqueço fácil', 'Equilibrado', 'Retenho bem'],
	},
	{
		id: 'reviewPace',
		title: 'Qual ritmo de revisão você prefere?',
		options: ['Leve', 'Equilibrado', 'Intenso'],
	},
];

const emptyProgress: OnboardingProgress = {
	answers: {},
	currentQuestion: 0,
	completed: false,
};

export async function getOnboardingProgress(): Promise<OnboardingProgress> {
	const storedProgress = await AsyncStorage.getItem(STORAGE_KEY);

	if (!storedProgress) {
		return emptyProgress;
	}

	try {
		return { ...emptyProgress, ...JSON.parse(storedProgress) } as OnboardingProgress;
	} catch {
		return emptyProgress;
	}
}

export async function saveOnboardingAnswer(questionIndex: number, answer: string) {
	const progress = await getOnboardingProgress();
	const question = onboardingQuestions[questionIndex];

	if (!question) {
		return progress;
	}

	const updatedProgress: OnboardingProgress = {
		...progress,
		answers: { ...progress.answers, [question.id]: answer },
		currentQuestion: questionIndex + 1,
	};

	await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProgress));
	return updatedProgress;
}

export async function setOnboardingQuestion(currentQuestion: number) {
	const progress = await getOnboardingProgress();
	const updatedProgress = { ...progress, currentQuestion };

	await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProgress));
	return updatedProgress;
}

export async function completeOnboarding() {
	const progress = await getOnboardingProgress();
	const completedProgress = {
		...progress,
		currentQuestion: onboardingQuestions.length,
		completed: true,
	};

	await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(completedProgress));
	return completedProgress;
}
