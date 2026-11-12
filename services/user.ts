import { request } from './decks';

export type UserInfo = {
	name: string;
	username: string;
	email: string;
};

export type Stats = {
	streak: number;
	studiedToday: boolean;
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


export async function getUserInfo(): Promise<UserInfo> {
	const raw = asRecord(await request<unknown>('/user/info'));
	const nested = asRecord(raw.user ?? raw.data);
	const source = Object.keys(nested).length > 0 ? nested : raw;

	return {
		name: pickText(source.name, source.nome),
		username: pickText(source.username, source.userName),
		email: pickText(source.email),
	};
}

export function getStats() {
	return request<Stats>('/me/stats');
}