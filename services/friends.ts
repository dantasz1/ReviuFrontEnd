import { request } from './decks';

export type Person = {
	id: number;
	name: string;
	username?: string;
	profileImageUrl?: string;
};

export type FriendRequest = Person & { direction: 'sent' | 'received' };

export type UserInfo = {
	id?: number; 
	name: string;
	username: string;
	email: string;
	profileImageUrl?: string;
	verified: boolean;
};

function toPerson(raw: unknown): Person | null {
	if (typeof raw !== 'object' || raw === null) return null;

	const item = raw as Record<string, unknown>;
	const id = Number(item.id);
	if (!Number.isFinite(id)) return null;

	const username = String(item.username ?? '').trim();
	const name = String(item.name ?? '').trim() || username;
	const image = String(item.profileImageUrl ?? '').trim();

	return {
		id,
		name: name || `Usuário ${id}`,
		username: username || undefined,
		profileImageUrl: image || undefined,
	};
}


function directionOf(status: unknown): 'sent' | 'received' {
	const value = String(status ?? '').toUpperCase();
	return /SENT|ENVIAD|OUTGOING/.test(value) ? 'sent' : 'received';
}

// ---------- Usuário ----------
export async function getUserInfo(): Promise<UserInfo> {
	const raw = await request<Record<string, unknown>>('/user/info');
	const id = raw.id != null ? Number(raw.id) : NaN;

	return {
		id: Number.isFinite(id) ? id : undefined,
		name: String(raw.name ?? '').trim(),
		username: String(raw.username ?? '').trim(),
		email: String(raw.email ?? '').trim(),
		profileImageUrl: raw.profileImageUrl ? String(raw.profileImageUrl) : undefined,
		verified: Boolean(raw.verified),
	};
}


export async function getFriends(): Promise<Person[]> {
	const data = await request<unknown>('/user/friends');
	if (!Array.isArray(data)) return [];
	return data.map(toPerson).filter((person): person is Person => person !== null);
}

export async function unfriend(friendId: number) {
	return request<void>(`/user/friends/${friendId}/unfriend`, { method: 'DELETE' });
}


export async function getFriendRequests(): Promise<FriendRequest[]> {
	const data = await request<unknown>('/user/friends/requests');
	if (!Array.isArray(data)) return [];

	return data
		.map((item) => {
			const person = toPerson(item);
			if (!person) return null;
			const status = (item as Record<string, unknown>).requestStatus;
			return { ...person, direction: directionOf(status) } satisfies FriendRequest;
		})
		.filter((item): item is FriendRequest => item !== null);
}

export async function sendFriendRequest(friendId: number) {
	return request<void>(`/user/friends/request/${friendId}`, { method: 'POST' });
}
export async function searchUsers(username: string): Promise<Person[]> {
	const data = await request<unknown>(`/user/search?username=${encodeURIComponent(username)}`);
	if (!Array.isArray(data)) return [];
	return data.map(toPerson).filter((person): person is Person => person !== null);
}


export async function acceptFriendRequest(senderId: number) {
	return request<void>(`/user/friends/request/${senderId}/accept`, { method: 'PUT' });
}

export async function rejectFriendRequest(senderId: number) {
	return request<void>(`/user/friends/request/${senderId}/reject`, { method: 'DELETE' });
}

export async function cancelFriendRequest(receiverId: number) {
	return request<void>(`/user/friends/request/${receiverId}/cancel`, { method: 'DELETE' });
}