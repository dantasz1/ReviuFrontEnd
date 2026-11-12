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


export type PickedFile = { uri: string; name: string; mimeType?: string; size?: number };
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; 


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
	if (file.size && file.size > MAX_UPLOAD_BYTES) {
		throw new Error('O arquivo é muito grande. Escolha um PDF de até 10 MB.');
	}

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

			console.log('Upload falhou:', xhr.status, text); 

			const fallback =
				xhr.status === 413
					? 'O arquivo é grande demais para o servidor. Tente um PDF menor.'
					: xhr.status === 503
						? 'O serviço de geração está indisponível no momento. Tente novamente em instantes.'
						: `Não foi possível enviar o arquivo (HTTP ${xhr.status}).`;

			reject(new Error(parseErrorDetail(text) || fallback));
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

export function createDeck(name: string, color: string) {
	return request<Deck>('/decks', { body: JSON.stringify({ name, color }), method: 'POST' });
}

export function updateDeck(id: number, name: string, color: string) {
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


export async function generateCardsFromFile(deckId: number, file: PickedFile) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await uploadFile<unknown>(`/decks/${deckId}/cards/generate-from-file`, file);
    } catch (e) {
      const is503 = e instanceof Error && /503|indispon/i.test(e.message);
      if (!is503 || attempt === 2) throw e;
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
}


export function extractGeneratedCards(result: unknown): CardInput[] {
	let data: unknown = result;

	if (typeof data === 'string') {
		try {
			data = JSON.parse(data);
		} catch {
			return [];
		}
	}

	if (!Array.isArray(data)) return [];

	return data
		.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
		.map((item) => ({
			frontText: String(item.frontText ?? '').trim(),
			backText: String(item.backText ?? '').trim(),
		}))
		.filter((card) => card.frontText.length > 0 && card.backText.length > 0);
}

export function shareDeck(deckId: number, memberId: number) {
	return request<void>(`/decks/${deckId}/members/${memberId}`, { method: 'POST' });
}


export type ShareRequest = {
	id: number;
	deckName: string;
	senderName: string;
	direction: 'sent' | 'received';
};

function asRecord(value: unknown): Record<string, unknown> {
	return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function pickText(...values: unknown[]) {
	for (const value of values) {
		const text = typeof value === 'string' ? value.trim() : '';
		if (text) return text;
	}
	return '';
}


function toShareRequest(raw: unknown): ShareRequest | null {
	const item = asRecord(raw);
	const id = Number(item.id ?? item.requestId);
	if (!Number.isFinite(id)) return null;

	const deck = asRecord(item.deck);
	const sender = asRecord(item.sender ?? item.owner ?? item.from ?? item.requester);
	const status = String(item.requestStatus ?? item.status ?? item.direction ?? '').toUpperCase();

	return {
		id,
		deckName: pickText(item.deckName, deck.name, item.name) || 'Deck sem nome',
		senderName:
			pickText(item.senderName, item.ownerName, sender.name, sender.username, item.senderUsername) || 'Alguém',
		direction: /SENT|ENVIAD|OUTGOING/.test(status) ? 'sent' : 'received',
	};
}

export async function getShareRequests(): Promise<ShareRequest[]> {
	const data = await request<unknown>('/decks/share-requests');
	if (!Array.isArray(data)) return [];
	return data.map(toShareRequest).filter((item): item is ShareRequest => item !== null);
}


export function sendShareRequest(deckId: number, recipientId: number) {
	return request<void>(`/decks/${deckId}/share-requests/${recipientId}`, { method: 'POST' });
}

export function acceptShareRequest(requestId: number) {
	return request<void>(`/decks/share-requests/${requestId}/accept`, { method: 'PUT' });
}

export function rejectShareRequest(requestId: number) {
	return request<void>(`/decks/share-requests/${requestId}`, { method: 'DELETE' });
}
