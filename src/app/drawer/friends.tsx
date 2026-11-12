import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import LottieView from 'lottie-react-native';
import { type ComponentRef, useCallback, useEffect, useRef, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	useWindowDimensions,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
	type ShareRequest,
	USER_NAME_KEY,
	acceptShareRequest,
	getShareRequests,
	rejectShareRequest,
} from '../../../services/decks';
import {
	type FriendRequest,
	type Person,
	type UserInfo,
	acceptFriendRequest,
	cancelFriendRequest,
	getFriendRequests,
	getFriends,
	getUserInfo,
	rejectFriendRequest,
	searchUsers,
	sendFriendRequest,
	unfriend,
} from '../../../services/friends';

const colors = {
	ink: '#151515',
	muted: '#5A5A66',
	blue: '#3975F6',
	background: '#FFFFFF',
	lilac: '#F0E7FF',
	pink: '#FF3B78',
	yellow: '#FFD33D',
};

const avatarPalette = ['#C4574B', '#7A8CA5', '#D9A441', '#8A5A3C', '#5B8C6E', '#8B6BB5'];

function avatarColorFor(name: string) {
	if (!name) return '#D9D9D9';
	const sum = Array.from(name).reduce((total, char) => total + char.charCodeAt(0), 0);
	return avatarPalette[sum % avatarPalette.length];
}


function normalize(text: string) {
	return text
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim();
}

function messageOf(error: unknown, fallback: string) {
	return error instanceof Error ? error.message : fallback;
}


function Avatar({ name, imageUrl }: { name: string; imageUrl?: string }) {
	return (
		<View style={[styles.friendAvatar, { backgroundColor: avatarColorFor(name) }]}>
			{imageUrl ? (
				<Image contentFit="cover" source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} />
			) : (
				<Text style={styles.friendAvatarText}>{name.charAt(0).toUpperCase()}</Text>
			)}
		</View>
	);
}

function FriendRow({ person, onLongPress }: { person: Person; onLongPress: () => void }) {
	return (
		<Pressable
			accessibilityHint="Segure para desfazer a amizade"
			accessibilityRole="button"
			onLongPress={onLongPress}
			style={({ pressed }) => [styles.row, pressed && styles.pressed]}
		>
			<Avatar imageUrl={person.profileImageUrl} name={person.name} />
			<View style={styles.rowBody}>
				<Text numberOfLines={1} style={styles.friendName}>
					{person.name}
				</Text>
				{person.username ? (
					<Text numberOfLines={1} style={styles.friendMeta}>
						@{person.username}
					</Text>
				) : null}
			</View>
		</Pressable>
	);
}


function ReceivedRow({
	person,
	busy,
	onAccept,
	onReject,
}: {
	person: Person;
	busy: boolean;
	onAccept: () => void;
	onReject: () => void;
}) {
	return (
		<View style={styles.row}>
			<Avatar imageUrl={person.profileImageUrl} name={person.name} />
			<View style={styles.rowBody}>
				<Text numberOfLines={1} style={styles.friendName}>
					{person.name}
				</Text>
				<Text numberOfLines={1} style={styles.friendMeta}>
					{person.username ? `@${person.username}` : 'quer ser seu amigo'}
				</Text>
			</View>

			<View style={styles.requestActions}>
				<Pressable
					accessibilityLabel={`Recusar pedido de ${person.name}`}
					disabled={busy}
					onPress={onReject}
					style={({ pressed }) => [styles.rejectButton, (pressed || busy) && styles.pressed]}
				>
					<Text style={styles.rejectText}>Recusar</Text>
				</Pressable>
				<Pressable
					accessibilityLabel={`Aceitar pedido de ${person.name}`}
					disabled={busy}
					onPress={onAccept}
					style={({ pressed }) => [styles.acceptButton, (pressed || busy) && styles.pressed]}
				>
					<Text style={styles.acceptText}>Aceitar</Text>
				</Pressable>
			</View>
		</View>
	);
}


function SentRow({ person, busy, onCancel }: { person: Person; busy: boolean; onCancel: () => void }) {
	return (
		<View style={styles.row}>
			<Avatar imageUrl={person.profileImageUrl} name={person.name} />
			<View style={styles.rowBody}>
				<Text numberOfLines={1} style={styles.friendName}>
					{person.name}
				</Text>
				<Text numberOfLines={1} style={styles.friendMeta}>
					aguardando resposta
				</Text>
			</View>

			<Pressable
				accessibilityLabel={`Cancelar pedido para ${person.name}`}
				disabled={busy}
				onPress={onCancel}
				style={({ pressed }) => [styles.rejectButton, (pressed || busy) && styles.pressed]}
			>
				<Text style={styles.rejectText}>Cancelar</Text>
			</Pressable>
		</View>
	);
}


function ShareRow({
	item,
	busy,
	onAccept,
	onReject,
}: {
	item: ShareRequest;
	busy: boolean;
	onAccept: () => void;
	onReject: () => void;
}) {
	return (
		<View style={styles.row}>
			<View style={styles.shareIcon}>
				<Text style={styles.shareIconText}>{item.deckName.charAt(0).toUpperCase()}</Text>
			</View>
			<View style={styles.rowBody}>
				<Text numberOfLines={1} style={styles.friendName}>
					{item.deckName}
				</Text>
				<Text numberOfLines={1} style={styles.friendMeta}>
					de {item.senderName}
				</Text>
			</View>

			<View style={styles.requestActions}>
				<Pressable
					accessibilityLabel={`Recusar o deck ${item.deckName}`}
					disabled={busy}
					onPress={onReject}
					style={({ pressed }) => [styles.rejectButton, (pressed || busy) && styles.pressed]}
				>
					<Text style={styles.rejectText}>Recusar</Text>
				</Pressable>
				<Pressable
					accessibilityLabel={`Aceitar o deck ${item.deckName}`}
					disabled={busy}
					onPress={onAccept}
					style={({ pressed }) => [styles.acceptButton, (pressed || busy) && styles.pressed]}
				>
					<Text style={styles.acceptText}>Aceitar</Text>
				</Pressable>
			</View>
		</View>
	);
}

function AddFriendModal({
	visible,
	onClose,
	onAdd,
	statusFor,
}: {
	visible: boolean;
	onClose: () => void;
	onAdd: (person: Person) => Promise<void>;
	statusFor: (person: Person) => 'me' | 'friend' | 'pending' | 'none';
}) {
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<Person[]>([]);
	const [searching, setSearching] = useState(false);
	const [searched, setSearched] = useState(false);
	const [addingId, setAddingId] = useState<number | null>(null);
	const [error, setError] = useState<string | null>(null);

	const closeModal = () => {
		setQuery('');
		setResults([]);
		setSearching(false);
		setSearched(false);
		setAddingId(null);
		setError(null);
		onClose();
	};

	
	useEffect(() => {
		const term = query.trim().replace(/^@+/, '');
		let cancelled = false;

		const timer = setTimeout(async () => {
			if (term.length < 2) {
				setResults([]);
				setSearching(false);
				setSearched(false);
				return;
			}

			setSearching(true);
			try {
				const found = await searchUsers(term);
				if (cancelled) return;
				setResults(found);
				setError(null);
				setSearched(true);
			} catch (e) {
				if (!cancelled) setError(messageOf(e, 'Não foi possível buscar usuários.'));
			} finally {
				if (!cancelled) setSearching(false);
			}
		}, 400);

		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [query]);

	const handleAdd = async (person: Person) => {
		if (addingId !== null) return;
		setAddingId(person.id);
		setError(null);
		try {
			await onAdd(person);
		} catch (e) {
			setError(messageOf(e, 'Não foi possível enviar a solicitação.'));
		} finally {
			setAddingId(null);
		}
	};

	const visibleResults = results.filter((person) => statusFor(person) !== 'me');

	return (
		<Modal animationType="fade" transparent visible={visible} onRequestClose={closeModal}>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				style={styles.modalBackdrop}
			>
				<Pressable accessibilityLabel="Fechar" accessibilityRole="button" onPress={closeModal} style={styles.modalDismissArea} />

				<View style={styles.modalCard}>
					<View pointerEvents="none" style={styles.modalCircle} />

					<Pressable
						accessibilityLabel="Fechar adicionar amigo"
						accessibilityRole="button"
						onPress={closeModal}
						style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
					>
						<View style={styles.closeLineOne} />
						<View style={styles.closeLineTwo} />
					</Pressable>

					<LottieView
						autoPlay
						loop
						resizeMode="cover"
						source={require('@/assets/lotties/friends.json')}
						style={styles.friendIllustrationAnimation}
					/>

					<Text style={styles.inputLabel}>Buscar pelo username</Text>

					<TextInput
						accessibilityLabel="Username do amigo"
						autoCapitalize="none"
						autoCorrect={false}
						onChangeText={(value) => {
							setQuery(value.replace(/\s/g, ''));
							setError(null);
						}}
						returnKeyType="search"
						style={styles.friendInput}
						value={query}
					/>

					{error ? <Text style={styles.modalError}>{error}</Text> : null}

					<ScrollView
						keyboardShouldPersistTaps="handled"
						nestedScrollEnabled
						showsVerticalScrollIndicator={false}
						style={styles.resultsList}
					>
						{searching ? <ActivityIndicator color="#FFFFFF" style={styles.resultsState} /> : null}

						{!searching && searched && visibleResults.length === 0 ? (
							<Text style={styles.resultsEmpty}>Nenhum usuário encontrado.</Text>
						) : null}

						{!searching &&
							visibleResults.map((person) => {
								const status = statusFor(person);
								const isAdding = addingId === person.id;
								const disabled = status !== 'none' || addingId !== null;
								const label =
									status === 'friend'
										? 'Amigos'
										: status === 'pending'
											? 'Enviado'
											: isAdding
												? '...'
												: 'Adicionar';

								return (
									<View key={person.id} style={styles.resultRow}>
										<View
											style={[styles.resultAvatar, { backgroundColor: avatarColorFor(person.name) }]}
										>
											{person.profileImageUrl ? (
												<Image
													contentFit="cover"
													source={{ uri: person.profileImageUrl }}
													style={StyleSheet.absoluteFill}
												/>
											) : (
												<Text style={styles.resultAvatarText}>
													{person.name.charAt(0).toUpperCase()}
												</Text>
											)}
										</View>

										<View style={styles.resultBody}>
											<Text numberOfLines={1} style={styles.resultName}>
												{person.name}
											</Text>
											{person.username ? (
												<Text numberOfLines={1} style={styles.resultUsername}>
													@{person.username}
												</Text>
											) : null}
										</View>

										<Pressable
											accessibilityLabel={`Adicionar ${person.name}`}
											accessibilityRole="button"
											disabled={disabled}
											onPress={() => handleAdd(person)}
											style={({ pressed }) => [
												styles.addResultButton,
												status !== 'none' && styles.addResultButtonDone,
												pressed && styles.pressed,
											]}
										>
											<Text
												style={[
													styles.addResultText,
													status !== 'none' && styles.addResultTextDone,
												]}
											>
												{label}
											</Text>
										</Pressable>
									</View>
								);
							})}
					</ScrollView>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
}

export default function FriendsScreen() {
	const insets = useSafeAreaInsets();
	const { height: screenH, width: screenW } = useWindowDimensions();
	const curveSize = 1400;
	const searchRef = useRef<ComponentRef<typeof TextInput>>(null);

	const [isAddFriendVisible, setIsAddFriendVisible] = useState(false);
	const [friends, setFriends] = useState<Person[]>([]);
	const [requests, setRequests] = useState<FriendRequest[]>([]);
	const [shareRequests, setShareRequests] = useState<ShareRequest[]>([]);
	const [me, setMe] = useState<UserInfo | null>(null);
	const [search, setSearch] = useState('');
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [busyKey, setBusyKey] = useState<string | null>(null);
	const [error, setError] = useState('');

	const load = useCallback(async () => {
		
		const [friendsResult, requestsResult, infoResult, sharesResult] = await Promise.allSettled([
			getFriends(),
			getFriendRequests(),
			getUserInfo(),
			getShareRequests(),
		]);

		if (friendsResult.status === 'fulfilled') {
			setFriends(friendsResult.value);
			setError('');
		} else {
			setError(messageOf(friendsResult.reason, 'Não foi possível carregar seus amigos.'));
		}

		setRequests(requestsResult.status === 'fulfilled' ? requestsResult.value : []);
		setShareRequests(sharesResult.status === 'fulfilled' ? sharesResult.value : []);

		if (infoResult.status === 'fulfilled') {
			setMe(infoResult.value);
			
			if (infoResult.value.name) void AsyncStorage.setItem(USER_NAME_KEY, infoResult.value.name);
		}

		setLoading(false);
	}, []);

	
	useFocusEffect(
		useCallback(() => {
			void load();
		}, [load]),
	);

	const handleRefresh = async () => {
		setRefreshing(true);
		await load();
		setRefreshing(false);
	};

	const handleAdd = async (person: Person) => {
		await sendFriendRequest(person.id);
		await load();
	};

	const statusFor = (person: Person): 'me' | 'friend' | 'pending' | 'none' => {
		if (me?.id !== undefined && person.id === me.id) return 'me';
		if (friends.some((item) => item.id === person.id)) return 'friend';
		if (requests.some((item) => item.id === person.id)) return 'pending';
		return 'none';
	};

	
	const runAction = async (key: string, action: () => Promise<void>, errorTitle: string) => {
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

	const handleUnfriend = (person: Person) => {
		Alert.alert('Desfazer amizade', `Tem certeza que deseja remover ${person.name} dos seus amigos?`, [
			{ text: 'Cancelar', style: 'cancel' },
			{
				text: 'Remover',
				style: 'destructive',
				onPress: () => runAction(`friend-${person.id}`, () => unfriend(person.id), 'Não foi possível remover'),
			},
		]);
	};

	const handleAcceptShare = (item: ShareRequest) =>
		runAction(
			`share-${item.id}`,
			async () => {
				await acceptShareRequest(item.id);
				Alert.alert('Deck adicionado', `"${item.deckName}" já está na sua aba Decks.`);
			},
			'Não foi possível aceitar',
		);

	const receivedRequests = requests.filter((item) => item.direction === 'received');
	const sentRequests = requests.filter((item) => item.direction === 'sent');
	const receivedShares = shareRequests.filter((item) => item.direction === 'received');

	const query = normalize(search);
	const visibleFriends = friends.filter((person) => query === '' || normalize(person.name).includes(query));

	return (
		<View style={styles.screen}>
			<View
				pointerEvents="none"
				style={[
					styles.backgroundCurve,
					{
						borderRadius: curveSize / 2,
						height: curveSize,
						left: screenW * 0.05,
						top: screenH * 0.2,
						width: curveSize,
					},
				]}
			/>

			<ScrollView
				contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 98 }]}
				keyboardShouldPersistTaps="handled"
				refreshControl={<RefreshControl onRefresh={handleRefresh} refreshing={refreshing} />}
				showsVerticalScrollIndicator={false}
			>
				<View style={[styles.profileRow, { paddingTop: Math.max(insets.top, 10) }]}>
					<Image
						accessibilityLabel="Notificações"
						contentFit="contain"
						source={require('@/assets/images/home/NotificacaoAzul.svg')}
						style={styles.notificationIcon}
					/>
					<View style={[styles.avatar, { backgroundColor: avatarColorFor(me?.name ?? '') }]}>
						{me?.profileImageUrl ? (
							<Image contentFit="cover" source={{ uri: me.profileImageUrl }} style={StyleSheet.absoluteFill} />
						) : (
							<Text style={styles.avatarText}>{me?.name.charAt(0).toUpperCase() ?? ''}</Text>
						)}
					</View>
				</View>

				<View style={styles.titleRow}>
					<Text style={styles.title}>Amigos</Text>
					<Pressable
						accessibilityLabel="Adicionar amigo"
						accessibilityRole="button"
						onPress={() => setIsAddFriendVisible(true)}
						style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
					>
						<View style={styles.plusHorizontal} />
						<View style={styles.plusVertical} />
					</Pressable>
				</View>

				{me?.username ? <Text style={styles.myId}>@{me.username}</Text> : null}

				<Pressable onPress={() => searchRef.current?.focus()} style={styles.searchBar}>
					<TextInput
						accessibilityLabel="Buscar amigo"
						autoCapitalize="none"
						autoCorrect={false}
						onChangeText={setSearch}
						placeholder="Buscar amigo"
						placeholderTextColor="#8A8A99"
						ref={searchRef}
						returnKeyType="search"
						selectionColor={colors.blue}
						style={styles.searchInput}
						value={search}
					/>
					{search.length > 0 ? (
						<Pressable
							accessibilityLabel="Limpar busca"
							hitSlop={10}
							onPress={() => setSearch('')}
							style={styles.clearButton}
						>
							<View style={[styles.clearLine, { transform: [{ rotate: '45deg' }] }]} />
							<View style={[styles.clearLine, { transform: [{ rotate: '-45deg' }] }]} />
						</Pressable>
					) : null}
					<View style={styles.searchIconWrap}>
						<View style={styles.searchIcon} />
						<View style={styles.searchHandle} />
					</View>
				</Pressable>

				{loading ? <ActivityIndicator color={colors.blue} style={styles.state} /> : null}

				{error ? (
					<View style={styles.state}>
						<Text style={styles.stateText}>{error}</Text>
						<Pressable
							onPress={() => {
								setLoading(true);
								void load();
							}}
							style={styles.retryButton}
						>
							<Text style={styles.retryText}>Tentar de novo</Text>
						</Pressable>
					</View>
				) : null}

				{receivedRequests.length > 0 ? (
					<>
						<Text style={styles.sectionTitle}>Pedidos recebidos ({receivedRequests.length})</Text>
						<View style={styles.list}>
							{receivedRequests.map((person) => (
								<ReceivedRow
									busy={busyKey === `req-${person.id}`}
									key={`received-${person.id}`}
									onAccept={() =>
										runAction(`req-${person.id}`, () => acceptFriendRequest(person.id), 'Não foi possível aceitar')
									}
									onReject={() =>
										runAction(`req-${person.id}`, () => rejectFriendRequest(person.id), 'Não foi possível recusar')
									}
									person={person}
								/>
							))}
						</View>
					</>
				) : null}

				{receivedShares.length > 0 ? (
					<>
						<Text style={styles.sectionTitle}>Decks compartilhados com você ({receivedShares.length})</Text>
						<View style={styles.list}>
							{receivedShares.map((item) => (
								<ShareRow
									busy={busyKey === `share-${item.id}`}
									item={item}
									key={`share-${item.id}`}
									onAccept={() => handleAcceptShare(item)}
									onReject={() =>
										runAction(`share-${item.id}`, () => rejectShareRequest(item.id), 'Não foi possível recusar')
									}
								/>
							))}
						</View>
					</>
				) : null}

				{sentRequests.length > 0 ? (
					<>
						<Text style={styles.sectionTitle}>Pedidos enviados ({sentRequests.length})</Text>
						<View style={styles.list}>
							{sentRequests.map((person) => (
								<SentRow
									busy={busyKey === `req-${person.id}`}
									key={`sent-${person.id}`}
									onCancel={() =>
										runAction(`req-${person.id}`, () => cancelFriendRequest(person.id), 'Não foi possível cancelar')
									}
									person={person}
								/>
							))}
						</View>
					</>
				) : null}

				<Text style={styles.sectionTitle}>Amigos</Text>

				{!loading && !error && friends.length === 0 ? (
					<Text style={[styles.stateBlock, styles.stateText]}>
						Você ainda não tem amigos. Toque no + para adicionar alguém pelo username.
					</Text>
				) : null}

				{!loading && !error && friends.length > 0 && visibleFriends.length === 0 ? (
					<Text style={[styles.stateBlock, styles.stateText]}>
						Nenhum amigo encontrado para &quot;{search.trim()}&quot;.
					</Text>
				) : null}

				<View style={styles.list}>
					{visibleFriends.map((person) => (
						<FriendRow key={person.id} onLongPress={() => handleUnfriend(person)} person={person} />
					))}
				</View>

				{visibleFriends.length > 0 ? <Text style={styles.tip}>Segure um amigo para desfazer a amizade</Text> : null}
			</ScrollView>

			<AddFriendModal
				onAdd={handleAdd}
				onClose={() => setIsAddFriendVisible(false)}
				statusFor={statusFor}
				visible={isAddFriendVisible}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: { backgroundColor: colors.background, flex: 1, overflow: 'hidden' },
	backgroundCurve: { backgroundColor: colors.lilac, position: 'absolute' },
	content: { paddingHorizontal: 24, paddingTop: 14 },

	profileRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
	notificationIcon: { height: 26, width: 26 },
	avatar: {
		alignItems: 'center',
		borderColor: '#FFFFFF',
		borderRadius: 26,
		borderWidth: 3,
		elevation: 3,
		height: 52,
		justifyContent: 'center',
		overflow: 'hidden',
		shadowColor: '#777',
		shadowOpacity: 0.22,
		shadowRadius: 4,
		width: 52,
	},
	avatarText: { color: '#FFF4E9', fontSize: 22, fontWeight: '800' },

	titleRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
	title: { color: colors.ink, fontSize: 32, fontWeight: '900' },
	myId: { color: colors.muted, fontSize: 13, fontWeight: '600', marginTop: 2 },
	addButton: {
		alignItems: 'center',
		backgroundColor: '#111111',
		borderRadius: 14,
		height: 28,
		justifyContent: 'center',
		width: 28,
	},
	plusHorizontal: { backgroundColor: '#FFFFFF', borderRadius: 1, height: 2.5, position: 'absolute', width: 14 },
	plusVertical: { backgroundColor: '#FFFFFF', borderRadius: 1, height: 14, position: 'absolute', width: 2.5 },

	searchBar: {
		alignItems: 'center',
		alignSelf: 'stretch',
		backgroundColor: '#FFFFFF',
		borderColor: '#B9B9C6',
		borderRadius: 10,
		borderWidth: 1,
		flexDirection: 'row',
		height: 40,
		marginTop: 18,
		paddingHorizontal: 14,
	},
	searchInput: { color: colors.ink, flex: 1, fontSize: 16, height: '100%', padding: 0 },
	clearButton: { alignItems: 'center', height: 20, justifyContent: 'center', marginRight: 10, width: 20 },
	clearLine: { backgroundColor: colors.blue, borderRadius: 2, height: 2.5, position: 'absolute', width: 14 },
	searchIconWrap: { alignItems: 'center', height: 24, justifyContent: 'center', width: 24 },
	searchIcon: { borderColor: colors.blue, borderRadius: 10, borderWidth: 2.5, height: 18, width: 18 },
	searchHandle: {
		backgroundColor: colors.blue,
		borderRadius: 2,
		height: 3,
		left: 15,
		position: 'absolute',
		top: 18,
		transform: [{ rotate: '45deg' }],
		width: 8,
	},

	sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '800', marginTop: 28 },

	state: { alignItems: 'center', marginTop: 28 },
	stateBlock: { marginTop: 24 },
	stateText: { color: colors.muted, fontSize: 14, textAlign: 'center' },
	retryButton: { backgroundColor: colors.blue, borderRadius: 10, marginTop: 12, paddingHorizontal: 18, paddingVertical: 10 },
	retryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
	tip: { color: colors.muted, fontSize: 12, marginTop: 12, textAlign: 'center' },

	list: { marginTop: 8 },
	row: { alignItems: 'center', flexDirection: 'row', paddingVertical: 12 },
	pressed: { opacity: 0.75 },
	friendAvatar: {
		alignItems: 'center',
		borderColor: '#FFFFFF',
		borderRadius: 26,
		borderWidth: 2,
		elevation: 2,
		height: 52,
		justifyContent: 'center',
		overflow: 'hidden',
		width: 52,
	},
	friendAvatarText: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
	rowBody: { flex: 1, marginLeft: 14, marginRight: 8 },
	friendName: { color: colors.ink, fontSize: 20, fontWeight: '500' },
	friendMeta: { color: colors.muted, fontSize: 13, fontWeight: '500', marginTop: 2 },

	shareIcon: {
		alignItems: 'center',
		backgroundColor: colors.blue,
		borderRadius: 14,
		height: 52,
		justifyContent: 'center',
		width: 52,
	},
	shareIconText: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },

	requestActions: { flexDirection: 'row', gap: 8 },
	acceptButton: { backgroundColor: colors.blue, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
	acceptText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
	rejectButton: {
		backgroundColor: '#FFFFFF',
		borderColor: '#B9B9C6',
		borderRadius: 10,
		borderWidth: 1,
		paddingHorizontal: 12,
		paddingVertical: 9,
	},
	rejectText: { color: colors.muted, fontSize: 13, fontWeight: '800' },

	modalBackdrop: {
		alignItems: 'center',
		backgroundColor: 'rgba(21, 21, 21, 0.32)',
		flex: 1,
		justifyContent: 'center',
		padding: 16,
	},
	modalDismissArea: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
	modalCard: {
		backgroundColor: colors.blue,
		borderRadius: 24,
		elevation: 8,
		maxWidth: 420,
		overflow: 'hidden',
		padding: 16,
		shadowColor: '#000000',
		shadowOpacity: 0.22,
		shadowRadius: 12,
		width: '100%',
	},
	modalCircle: {
		backgroundColor: '#4A5FC1',
		borderRadius: 260,
		height: 520,
		position: 'absolute',
		right: -300,
		top: -70,
		width: 520,
	},
	closeButton: { height: 28, justifyContent: 'center', width: 28 },
	closeLineOne: {
		backgroundColor: '#FFFFFF',
		borderRadius: 2,
		height: 3,
		position: 'absolute',
		transform: [{ rotate: '45deg' }],
		width: 20,
	},
	closeLineTwo: {
		backgroundColor: '#FFFFFF',
		borderRadius: 2,
		height: 3,
		position: 'absolute',
		transform: [{ rotate: '-45deg' }],
		width: 20,
	},
	friendIllustrationAnimation: { alignSelf: 'center', height: 110, marginTop: 4, width: '100%' },
	inputLabel: {
		color: '#FFFFFF',
		fontSize: 17,
		fontWeight: '700',
		marginTop: 28,
		textAlign: 'center',
	},
	friendInput: {
		backgroundColor: '#D9D9D9',
		borderRadius: 10,
		color: colors.ink,
		fontSize: 16,
		height: 40,
		marginTop: 10,
		paddingHorizontal: 12,
	},
	modalError: { color: '#FFE3E3', fontSize: 13, fontWeight: '600', marginTop: 8 },
	resultsList: { marginTop: 12, maxHeight: 220 },
	resultsState: { marginVertical: 16 },
	resultsEmpty: { color: '#DDE6FF', fontSize: 14, marginVertical: 16, textAlign: 'center' },
	resultRow: { alignItems: 'center', flexDirection: 'row', paddingVertical: 8 },
	resultAvatar: {
		alignItems: 'center',
		borderColor: '#FFFFFF',
		borderRadius: 22,
		borderWidth: 2,
		height: 44,
		justifyContent: 'center',
		overflow: 'hidden',
		width: 44,
	},
	resultAvatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
	resultBody: { flex: 1, marginHorizontal: 12 },
	resultName: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
	resultUsername: { color: '#DDE6FF', fontSize: 12, fontWeight: '500', marginTop: 1 },
	addResultButton: {
		alignItems: 'center',
		backgroundColor: '#FFD43B',
		borderRadius: 10,
		justifyContent: 'center',
		minWidth: 86,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	addResultButtonDone: { backgroundColor: 'rgba(255,255,255,0.25)' },
	addResultText: { color: '#111111', fontSize: 13, fontWeight: '800' },
	addResultTextDone: { color: '#FFFFFF' },
});