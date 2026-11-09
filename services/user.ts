import { request } from './decks';

export type Me = {
	id: number | string;
	name: string;
	email: string;
	avatarUrl?: string;
};

export type Stats = {
	coins: number;
	streak: number;
	studiedToday: boolean;
};

export function getMe() {
	return request<Me>('/me');
}

export function getStats() {
	return request<Stats>('/me/stats');
}