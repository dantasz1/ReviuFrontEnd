import AsyncStorage from '@react-native-async-storage/async-storage';

export const AUTH_TOKEN_KEY = '@reviu/auth-token';
export const USER_NAME_KEY = '@reviu/user-name';

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

export type Deck = { id: number; name: string; color?: string | null; cards: DeckCard[] };

export type CardInput = {
	frontText: string;
	backText: string;
	imageUrl?: string;
	audioUrl?: string;
};


export type PickedFile = { uri: string; name: string; mimeType?: string };

function getApiBaseUrl() {
	const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');
	if (!baseUrl) throw new Error('Configure a URL da API em EXPO_PUBLIC_API_URL.');
	return baseUrl;
}


function parseErrorDetail(text: string) {
	try {
		const body: unknown = JSON.parse(text);
		if (typeof body === 'object' && body !== null) {
			const value = body as Record<string, unknown>;

			if (Array.isArray(value.errors)) {
				const details = value.errors
					.map((item) => {
						if (typeof item === 'string') return item;
						const e = item as Record<string, unknown>;
						const msg = String(e.defaultMessage ?? e.message ?? '');
						return e.field ? `${e.field}: ${msg}` : msg;
					})
					.filter(Boolean);
				if (details.length) return details.join(' ');
			}

			return String(value.detail ?? value.message ?? value.error ?? '');
		}
		if (typeof body === 'string') return body;
		return '';
	} catch {
		return text.length > 0 && text.length <= 200 ? text : '';
	}
}

function parseSuccessBody<T>(text: string): T {
	if (!text) return undefined as T;
	try {
		return JSON.parse(text) as T;
	} catch {
		
		return text as unknown as T;
	}
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
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
		const detail = parseErrorDetail(await response.text());
		throw new Error(detail || `Não foi possível acessar a API (HTTP ${response.status}).`);
	}

	if (response.status === 204) return undefined as T;
	return parseSuccessBody<T>(await response.text());
}


async function uploadFile<T>(path: string, file: PickedFile): Promise<T> {
	const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);

	const form = new FormData();
	form.append('file', {
		uri: file.uri,
		name: file.name,
		type: file.mimeType ?? 'application/octet-stream',
	} as unknown as Blob);

	return new Promise<T>((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open('POST', `${getApiBaseUrl()}${path}`);
		xhr.setRequestHeader('Accept', '*/*');
		
		if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
		xhr.timeout = 120000; 

		xhr.onload = () => {
			const text = xhr.responseText ?? '';
			if (xhr.status >= 200 && xhr.status < 300) {
				resolve(parseSuccessBody<T>(text));
				return;
			}
			reject(new Error(parseErrorDetail(text) || `Não foi possível enviar o arquivo (HTTP ${xhr.status}).`));
		};
		xhr.onerror = () => reject(new Error('Falha de rede ao enviar o arquivo.'));
		xhr.ontimeout = () => reject(new Error('O envio demorou demais. Tente um PDF menor.'));

		xhr.send(form);
	});
}

// ---------- Decks ----------
export function getDecks() {
	return request<Deck[]>('/decks');
}

export function createDeck(name: string, color?: string) {
	return request<Deck>('/decks', { body: JSON.stringify({ name, color }), method: 'POST' });
}

export function updateDeck(id: number, name: string, color?: string) {
	return request<Deck>(`/decks/${id}`, { body: JSON.stringify({ id, name, color }), method: 'PUT' });
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


export function createCardsBulk(deckId: number, cards: CardInput[]) {
	return request<DeckCard[]>(`/decks/${deckId}/cards/bulk`, {
		body: JSON.stringify(cards),
		method: 'POST',
	});
}


export function reviewCard(deckId: number, cardId: number, quality: number) {
	return request<DeckCard>(`/decks/${deckId}/cards/${cardId}/review`, {
		body: JSON.stringify({ quality }),
		method: 'POST',
	});
}


export function uploadCardFile(deckId: number, file: PickedFile) {
	return uploadFile<{ url: string }>(`/decks/${deckId}/cards/upload`, file);
}


export function generateCardsFromFile(deckId: number, file: PickedFile) {
	return uploadFile<CardInput[]>(
		`/decks/${deckId}/cards/generate-from-file`,
		file
	);
}