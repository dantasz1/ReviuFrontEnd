import { router, useFocusEffect } from 'expo-router';
import { type ReactNode, useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { SettingsPage, settingsColors } from '@/components/SettingsPage';
import { acceptShareRequest, rejectShareRequest } from '../../../services/decks';
import { acceptFriendRequest, rejectFriendRequest } from '../../../services/friends';
import { type Inbox, getInbox } from '../../../services/inbox';

const deckAccents = ['#FFD33D', '#FF3B78', '#18D09C', '#8A3FFC', '#00CFFF'];

function messageOf(error: unknown, fallback: string) {
	return error instanceof Error ? error.message : fallback;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
	return (
		<View style={styles.section}>
			<Text style={styles.sectionTitle}>{title}</Text>
			<View style={styles.card}>{children}</View>
		</View>
	);
}

function Row({
	title,
	subtitle,
	divider,
	actions,
	onPress,
}: {
	title: string;
	subtitle: string;
	divider: boolean;
	actions?: ReactNode;
	onPress?: () => void;
}) {
	return (
		<Pressable
			disabled={!onPress}
			onPress={onPress}
			style={({ pressed }) => [styles.row, divider && styles.rowDivider, pressed && { opacity: 0.8 }]}
		>
			<View style={styles.rowBody}>
				<Text numberOfLines={1} style={styles.rowTitle}>
					{title}
				</Text>
				<Text numberOfLines={2} style={styles.rowSubtitle}>
					{subtitle}
				</Text>
			</View>
			{actions}
		</Pressable>
	);
}

function AcceptReject({ busy, onAccept, onReject }: { busy: boolean; onAccept: () => void; onReject: () => void }) {
	return (
		<View style={styles.actions}>
			<Pressable
				disabled={busy}
				onPress={onReject}
				style={({ pressed }) => [styles.rejectButton, (pressed || busy) && { opacity: 0.6 }]}
			>
				<Text style={styles.rejectText}>Recusar</Text>
			</Pressable>
			<Pressable
				disabled={busy}
				onPress={onAccept}
				style={({ pressed }) => [styles.acceptButton, (pressed || busy) && { opacity: 0.6 }]}
			>
				<Text style={styles.acceptText}>Aceitar</Text>
			</Pressable>
		</View>
	);
}

export default function NotificationsCenterScreen() {
	const [inbox, setInbox] = useState<Inbox | null>(null);
	const [busyKey, setBusyKey] = useState<string | null>(null);

	const load = useCallback(async () => {
		setInbox(await getInbox());
	}, []);

	
	useFocusEffect(
		useCallback(() => {
			void load();
		}, [load]),
	);

	
	const run = async (key: string, action: () => Promise<void>, errorTitle: string) => {
		setBusyKey(key);
		try {
			await action();
			await load();
		} catch (e) {
			Alert.alert(errorTitle, messageOf(e, 'Tente novamente.'));
		} finally {
			setBusyKey(null);
		}
	};

	const empty =
		inbox !== null &&
		inbox.friendRequests.length === 0 &&
		inbox.shareRequests.length === 0 &&
		inbox.dueDecks.length === 0;

	return (
		<SettingsPage title="Notificações">
			{inbox === null ? <ActivityIndicator color={settingsColors.blue} style={{ marginTop: 40 }} /> : null}

			{empty ? (
				<View style={styles.empty}>
					<Text style={styles.emptyTitle}>Tudo em dia! 🎉</Text>
					<Text style={styles.emptyText}>Quando houver pedidos de amizade, decks compartilhados ou cards para revisar, eles aparecem aqui.</Text>
				</View>
			) : null}

			{inbox && inbox.friendRequests.length > 0 ? (
				<Section title="Pedidos de amizade">
					{inbox.friendRequests.map((person, index) => (
						<Row
							actions={
								<AcceptReject
									busy={busyKey === `friend-${person.id}`}
									onAccept={() =>
										run(`friend-${person.id}`, () => acceptFriendRequest(person.id), 'Não foi possível aceitar')
									}
									onReject={() =>
										run(`friend-${person.id}`, () => rejectFriendRequest(person.id), 'Não foi possível recusar')
									}
								/>
							}
							divider={index > 0}
							key={`friend-${person.id}`}
							subtitle={person.username ? `@${person.username}` : 'quer ser seu amigo'}
							title={`${person.name} quer ser seu amigo`}
						/>
					))}
				</Section>
			) : null}

			{inbox && inbox.shareRequests.length > 0 ? (
				<Section title="Decks compartilhados com você">
					{inbox.shareRequests.map((item, index) => (
						<Row
							actions={
								<AcceptReject
									busy={busyKey === `share-${item.id}`}
									onAccept={() =>
										run(
											`share-${item.id}`,
											async () => {
												await acceptShareRequest(item.id);
												Alert.alert('Deck adicionado', `"${item.deckName}" já está na sua aba Decks.`);
											},
											'Não foi possível aceitar',
										)
									}
									onReject={() =>
										run(`share-${item.id}`, () => rejectShareRequest(item.id), 'Não foi possível recusar')
									}
								/>
							}
							divider={index > 0}
							key={`share-${item.id}`}
							subtitle={`de ${item.senderName}`}
							title={item.deckName}
						/>
					))}
				</Section>
			) : null}

			{inbox && inbox.dueDecks.length > 0 ? (
				<Section title="Cards para revisar">
					{inbox.dueDecks.map(({ deck, due }, index) => (
						<Row
							divider={index > 0}
							key={`due-${deck.id}`}
							onPress={() =>
								router.push({
									pathname: '/deck/[id]',
									params: {
										id: String(deck.id),
										name: deck.name,
										color: deck.color ?? deckAccents[deck.id % deckAccents.length],
									},
								})
							}
							subtitle="Toque para abrir o deck"
							title={`${deck.name}: ${due} ${due === 1 ? 'card' : 'cards'}`}
						/>
					))}
				</Section>
			) : null}
		</SettingsPage>
	);
}

const styles = StyleSheet.create({
	section: { marginBottom: 22 },
	sectionTitle: { color: settingsColors.ink, fontSize: 17, fontWeight: '800', marginBottom: 10 },
	card: { backgroundColor: '#FFFFFF', borderRadius: 18, elevation: 2, paddingHorizontal: 16 },
	row: { alignItems: 'center', flexDirection: 'row', gap: 10, paddingVertical: 14 },
	rowDivider: { borderTopColor: '#EDE6FA', borderTopWidth: 1 },
	rowBody: { flex: 1 },
	rowTitle: { color: settingsColors.ink, fontSize: 15, fontWeight: '800' },
	rowSubtitle: { color: settingsColors.muted, fontSize: 13, marginTop: 2 },
	actions: { flexDirection: 'row', gap: 8 },
	acceptButton: { backgroundColor: settingsColors.blue, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
	acceptText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
	rejectButton: {
		backgroundColor: '#FFFFFF',
		borderColor: '#B9B9C6',
		borderRadius: 10,
		borderWidth: 1,
		paddingHorizontal: 10,
		paddingVertical: 8,
	},
	rejectText: { color: settingsColors.muted, fontSize: 13, fontWeight: '800' },
	empty: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, elevation: 2, marginTop: 8, padding: 28 },
	emptyTitle: { color: settingsColors.ink, fontSize: 18, fontWeight: '900' },
	emptyText: { color: settingsColors.muted, fontSize: 14, lineHeight: 20, marginTop: 8, textAlign: 'center' },
});
