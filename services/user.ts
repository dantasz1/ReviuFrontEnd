import { request } from './decks';

export type UserInfo = {
	name: string;
	username: string;
	email: string;
	currentStreak: number;
	lastReviewDate?: string;
	timezone?: string;
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

	const currentStreak = Number(source.currentStreak);

	return {
		name: pickText(source.name, source.nome),
		username: pickText(source.username, source.userName),
		email: pickText(source.email),
		currentStreak: Number.isFinite(currentStreak) && currentStreak >= 0 ? currentStreak : 0,
		lastReviewDate: pickText(source.lastReviewDate),
		timezone: pickText(source.timezone),
	};
}

export function updateUserTimezone(timezone: string) {
	return request<void>('/user/timezone', {
		body: JSON.stringify({ timezone }),
		method: 'PUT',
	});
}

export function getStats() {
	return request<Stats>('/me/stats');
}
