import { type Deck, type ShareRequest, getDecks, getShareRequests } from './decks';
import { type FriendRequest, getFriendRequests } from './friends';

export type Inbox = {
	friendRequests: FriendRequest[]; 
	shareRequests: ShareRequest[]; 
	dueDecks: { deck: Deck; due: number }[]; 
};

function todayKey() {
	const now = new Date();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	return `${now.getFullYear()}-${month}-${day}`;
}

function countDue(deck: Deck) {
	const today = todayKey();
	return (deck.cards ?? []).filter((card) => !card.nextReview || card.nextReview.slice(0, 10) <= today).length;
}


export async function getUnreadCount(): Promise<number> {
	const [friends, shares] = await Promise.allSettled([getFriendRequests(), getShareRequests()]);

	const friendCount =
		friends.status === 'fulfilled' ? friends.value.filter((item) => item.direction === 'received').length : 0;
	const shareCount =
		shares.status === 'fulfilled' ? shares.value.filter((item) => item.direction === 'received').length : 0;

	return friendCount + shareCount;
}

export async function getInbox(): Promise<Inbox> {
	const [friends, shares, decks] = await Promise.allSettled([getFriendRequests(), getShareRequests(), getDecks()]);

	return {
		friendRequests:
			friends.status === 'fulfilled' ? friends.value.filter((item) => item.direction === 'received') : [],
		shareRequests:
			shares.status === 'fulfilled' ? shares.value.filter((item) => item.direction === 'received') : [],
		dueDecks:
			decks.status === 'fulfilled'
				? decks.value
						.map((deck) => ({ deck, due: countDue(deck) }))
						.filter((item) => item.due > 0)
						.sort((a, b) => b.due - a.due)
				: [],
	};
}