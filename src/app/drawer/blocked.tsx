import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type Person, getBlockedUsers, unblockUser } from '../../../services/friends';

const colors = { ink: '#151515', muted: '#5A5A66', blue: '#3975F6', background: '#FFFFFF', lilac: '#F0E7FF' };
const avatarPalette = ['#C4574B', '#7A8CA5', '#D9A441', '#8A5A3C', '#5B8C6E', '#8B6BB5'];

function avatarColorFor(name: string) {
	if (!name) return '#D9D9D9';
	const sum = Array.from(name).reduce((total, char) => total + char.charCodeAt(0), 0);
	return avatarPalette[sum % avatarPalette.length];
}

function messageOf(error: unknown, fallback: string) {
	return error instanceof Error ? error.message : fallback;
}

function BlockedRow({ person, busy, onUnblock }: { person: Person; busy: boolean; onUnblock: () => void }) {
	return (
		<View style={styles.row}>
			<View style={[styles.avatar, { backgroundColor: avatarColorFor(person.name) }]}>
				{person.profileImageUrl ? <Image contentFit="cover" source={{ uri: person.profileImageUrl }} style={StyleSheet.absoluteFill} /> : <Text style={styles.avatarText}>{person.name.charAt(0).toUpperCase()}</Text>}
			</View>
			<View style={styles.rowBody}>
				<Text numberOfLines={1} style={styles.name}>{person.name}</Text>
				{person.username ? <Text numberOfLines={1} style={styles.username}>@{person.username}</Text> : null}
			</View>
			<Pressable accessibilityLabel={`Desbloquear ${person.name}`} accessibilityRole="button" disabled={busy} onPress={onUnblock} style={({ pressed }) => [styles.unblockButton, (pressed || busy) && styles.pressed]}>
				<Text style={styles.unblockText}>{busy ? '...' : 'Desbloquear'}</Text>
			</Pressable>
		</View>
	);
}

export default function BlockedScreen() {
	const insets = useSafeAreaInsets();
	const [blockedUsers, setBlockedUsers] = useState<Person[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [busyId, setBusyId] = useState<number | null>(null);
	const [error, setError] = useState('');

	const load = useCallback(async () => {
		setError('');
		try {
			setBlockedUsers(await getBlockedUsers());
		} catch (e) {
			setError(messageOf(e, 'Não foi possível carregar as contas bloqueadas.'));
		} finally {
			setLoading(false);
		}
	}, []);

	useFocusEffect(useCallback(() => { void load(); }, [load]));

	const handleUnblock = (person: Person) => {
		Alert.alert('Desbloquear usuário', `Deseja desbloquear ${person.name}?`, [
			{ text: 'Cancelar', style: 'cancel' },
			{
				text: 'Desbloquear',
				onPress: async () => {
					setBusyId(person.id);
					try {
						await unblockUser(person.id);
						setBlockedUsers((current) => current.filter((item) => item.id !== person.id));
					} catch (e) {
						Alert.alert('Não foi possível desbloquear', messageOf(e, 'Tente novamente.'));
					} finally {
						setBusyId(null);
					}
				},
			},
		]);
	};

	const handleRefresh = async () => {
		setRefreshing(true);
		await load();
		setRefreshing(false);
	};

	return (
		<View style={styles.screen}>
			<View pointerEvents="none" style={styles.backgroundCurve} />
			<ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 98 }]} refreshControl={<RefreshControl onRefresh={handleRefresh} refreshing={refreshing} />} showsVerticalScrollIndicator={false}>
				<Pressable accessibilityLabel="Voltar" accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}><Text style={styles.backText}>‹</Text></Pressable>
				<Text style={styles.title}>Contas bloqueadas</Text>
				<Text style={styles.subtitle}>Essas pessoas não poderão interagir com você.</Text>
				{loading ? <ActivityIndicator color={colors.blue} style={styles.state} /> : null}
				{error ? <View style={styles.state}><Text style={styles.stateText}>{error}</Text><Pressable onPress={() => { setLoading(true); void load(); }} style={styles.retryButton}><Text style={styles.retryText}>Tentar de novo</Text></Pressable></View> : null}
				{!loading && !error && blockedUsers.length === 0 ? <Text style={styles.empty}>Você não bloqueou ninguém.</Text> : null}
				<View style={styles.list}>{blockedUsers.map((person) => <BlockedRow busy={busyId === person.id} key={person.id} onUnblock={() => handleUnblock(person)} person={person} />)}</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: { backgroundColor: colors.background, flex: 1, overflow: 'hidden' },
	backgroundCurve: { backgroundColor: colors.lilac, borderRadius: 700, height: 1400, left: -650, position: 'absolute', top: 500, width: 1400 },
	content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 14 },
	backButton: { height: 42, justifyContent: 'center', marginLeft: -8, width: 42 },
	backText: { color: colors.ink, fontSize: 40, lineHeight: 40 },
	title: { color: colors.ink, fontSize: 30, fontWeight: '900', marginTop: 12 },
	subtitle: { color: colors.muted, fontSize: 14, marginTop: 6 },
	state: { alignItems: 'center', marginTop: 32 },
	stateText: { color: colors.muted, fontSize: 14, textAlign: 'center' },
	retryButton: { backgroundColor: colors.blue, borderRadius: 10, marginTop: 12, paddingHorizontal: 18, paddingVertical: 10 },
	retryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
	empty: { color: colors.muted, fontSize: 15, marginTop: 44, textAlign: 'center' },
	list: { marginTop: 22 },
	row: { alignItems: 'center', flexDirection: 'row', paddingVertical: 12 },
	avatar: { alignItems: 'center', borderColor: '#FFFFFF', borderRadius: 26, borderWidth: 2, height: 52, justifyContent: 'center', overflow: 'hidden', width: 52 },
	avatarText: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
	rowBody: { flex: 1, marginHorizontal: 14 },
	name: { color: colors.ink, fontSize: 18, fontWeight: '600' },
	username: { color: colors.muted, fontSize: 13, marginTop: 2 },
	unblockButton: { borderColor: colors.blue, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
	unblockText: { color: colors.blue, fontSize: 12, fontWeight: '800' },
	pressed: { opacity: 0.65 },
});
