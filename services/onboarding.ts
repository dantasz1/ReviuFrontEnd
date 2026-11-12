import AsyncStorage from '@react-native-async-storage/async-storage';

import { request } from './decks';

const ONBOARDING_KEY = '@reviu/onboarding-answers';

export type OnboardingAnswers = {
	focoEstudos?: string;
	prazoFinal?: string;
	metaDiaria?: string;
	horarioFoco?: string;
	retencaoConteudo?: string;
	ritmoRevisao?: string;
};

export async function loadOnboardingAnswers(): Promise<OnboardingAnswers> {
	try {
		const saved = await AsyncStorage.getItem(ONBOARDING_KEY);
		return saved ? (JSON.parse(saved) as OnboardingAnswers) : {};
	} catch {
		return {};
	}
}


export async function saveOnboardingAnswer(key: keyof OnboardingAnswers, value: string) {
	const current = await loadOnboardingAnswers();
	await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify({ ...current, [key]: value }));
}

export async function clearOnboardingAnswers() {
	await AsyncStorage.removeItem(ONBOARDING_KEY);
}



export function updateOnboarding(answers: OnboardingAnswers) {
	return request<void>('/user/onboarding', {
		body: JSON.stringify(answers),
		method: 'PUT',
	});
}

