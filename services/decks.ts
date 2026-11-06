import AsyncStorage from '@react-native-async-storage/async-storage';

export const AUTH_TOKEN_KEY = '@reviu/auth-token';

export type DeckCard = {
	id: number;
	frontText: string;
	backText: string;
	repetition: number;
	interval: number;
	easinessFactor: number;
	nextReview: string;
	imageUrl?: string;
	audioUrl?: string;
};

export type Deck = { id: number; name: string; cards: DeckCard[] };

function getApiBaseUrl() {
	const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');
	if (!baseUrl) throw new Error('Configure a URL da API em EXPO_PUBLIC_API_URL.');
	return baseUrl;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
	const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
	const response = await fetch(`${getApiBaseUrl()}${path}`, {
		...options,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...options.headers,
		},
	});

	if (!response.ok) {
		const text = await response.text();
		let detail = '';
		try {
			const body: unknown = JSON.parse(text);
			if (typeof body === 'object' && body !== null) {
				const value = body as Record<string, unknown>;
				detail = String(value.detail ?? value.message ?? value.error ?? '');
			}
		} catch {
			detail = '';
		}
		throw new Error(detail || `Não foi possível acessar os decks (HTTP ${response.status}).`);
	}

	if (response.status === 204) return undefined as T;
	return response.json() as Promise<T>;
}

export function getDecks() { return request<Deck[]>('/decks'); }
export function createDeck(name: string) { return request<Deck>('/decks', { body: JSON.stringify({ name }), method: 'POST' }); }
export function updateDeck(id: number, name: string) { return request<Deck>(`/decks/${id}`, { body: JSON.stringify({ id, name }), method: 'PUT' }); }
export function deleteDeck(id: number) { return request<void>(`/decks/${id}`, { method: 'DELETE' }); }
