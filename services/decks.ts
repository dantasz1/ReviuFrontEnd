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

export type CardInput = {
	frontText: string;
	backText: string;
	imageUrl?: string;
	audioUrl?: string;
};

// Arquivo escolhido no celular (expo-document-picker / expo-image-picker)
export type PickedFile = { uri: string; name: string; mimeType?: string };

function getApiBaseUrl() {
	const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');
	if (!baseUrl) throw new Error('Configure a URL da API em EXPO_PUBLIC_API_URL.');
	return baseUrl;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
	const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
	const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

	const response = await fetch(`${getApiBaseUrl()}${path}`, {
		...options,
		headers: {
			Accept: 'application/json',
			// em upload o fetch define o Content-Type sozinho (com o boundary)
			...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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
			} else if (typeof body === 'string') {
				detail = body;
			}
		} catch {
			// resposta em texto puro (ex.: "Arquivo inválido")
			detail = text.length > 0 && text.length <= 200 ? text : '';
		}
		throw new Error(detail || `Não foi possível acessar a API (HTTP ${response.status}).`);
	}

	if (response.status === 204) return undefined as T;

	// Algumas rotas respondem texto puro, então lemos como texto e tentamos JSON
	const text = await response.text();
	if (!text) return undefined as T;
	try {
		return JSON.parse(text) as T;
	} catch {
		return text as unknown as T;
	}
}

function toFormData(file: PickedFile) {
	const form = new FormData();
	// no React Native o arquivo vai como objeto { uri, name, type }
	form.append('file', {
		uri: file.uri,
		name: file.name,
		type: file.mimeType ?? 'application/octet-stream',
	} as unknown as Blob);
	return form;
}

// ---------- Decks ----------
export function getDecks() {
	return request<Deck[]>('/decks');
}

export function createDeck(name: string) {
	return request<Deck>('/decks', { body: JSON.stringify({ name }), method: 'POST' });
}

export function updateDeck(id: number, name: string) {
	return request<Deck>(`/decks/${id}`, { body: JSON.stringify({ id, name }), method: 'PUT' });
}

export function deleteDeck(id: number) {
	return request<void>(`/decks/${id}`, { method: 'DELETE' });
}

// ---------- Cards ----------
export function getCards(deckId: number) {
	return request<DeckCard[]>(`/decks/${deckId}/cards`);
}

export function getDueCards(deckId: number) {
	return request<DeckCard[]>(`/decks/${deckId}/cards/due`);
}

export function createCard(deckId: number, data: CardInput) {
	return request<DeckCard>(`/decks/${deckId}/cards`, { body: JSON.stringify(data), method: 'POST' });
}

export function updateCard(deckId: number, cardId: number, data: CardInput) {
	return request<DeckCard>(`/decks/${deckId}/cards/${cardId}`, {
		body: JSON.stringify({ id: cardId, ...data }),
		method: 'PUT',
	});
}

export function deleteCard(deckId: number, cardId: number) {
	return request<void>(`/decks/${deckId}/cards/${cardId}`, { method: 'DELETE' });
}

// Corpo é a lista direta de cards
export function createCardsBulk(deckId: number, cards: CardInput[]) {
	return request<DeckCard[]>(`/decks/${deckId}/cards/bulk`, {
		body: JSON.stringify(cards),
		method: 'POST',
	});
}

// SM2: nota de revisão enviada em { quality }
export function reviewCard(deckId: number, cardId: number, quality: number) {
	return request<DeckCard>(`/decks/${deckId}/cards/${cardId}/review`, {
		body: JSON.stringify({ quality }),
		method: 'POST',
	});
}

// Envia imagem ou áudio e devolve a URL gerada (use em imageUrl / audioUrl do card)
export function uploadCardFile(deckId: number, file: PickedFile) {
	return request<{ url: string }>(`/decks/${deckId}/cards/upload`, {
		body: toFormData(file),
		method: 'POST',
	});
}

// Gera cards com IA a partir de um PDF. A API responde texto, então depois
// chame getCards(deckId) para recarregar a lista.
export function generateCardsFromFile(deckId: number, file: PickedFile) {
	return request<string>(`/decks/${deckId}/cards/generate-from-file`, {
		body: toFormData(file),
		method: 'POST',
	});
}