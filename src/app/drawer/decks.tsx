import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { type ComponentRef, useCallback, useEffect, useRef, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	Animated,
	Keyboard,
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
import Svg, { Polygon } from 'react-native-svg';
import {
	createDeck,
	deleteDeck,
	getDecks,
	sendShareRequest,
	updateDeck,
	USER_NAME_KEY,
	type Deck,
} from '../../../services/decks';
import { getFriends, type Person } from '../../../services/friends';

const colors = {
	blue: '#3975F6',
	shape: '#536BCB',
	ink: '#111111',
	muted: '#5A5A66',
	yellow: '#FFD33D',
	pink: '#FF3B78',
	green: '#18D09C',
	lilac: '#F0E7FF',
	danger: '#E0293F',
};

const themeColors = [
	'#FFC93A',
	'#FF3B8B',
	'#12B886',
	'#E0293F',
	'#8A3FFC',
	'#00CFFF',
	'#FF9500',
	'#FF7070',
	'#238636',
	'#009B77',
];

type Shape = { fill: string; points: string };

function adjustColor(color: string, factor: number) {
	const hex = color.replace('#', '');
	const red = Math.min(255, Math.round(parseInt(hex.slice(0, 2), 16) * factor));
	const green = Math.min(255, Math.round(parseInt(hex.slice(2, 4), 16) * factor));
	const blue = Math.min(255, Math.round(parseInt(hex.slice(4, 6), 16) * factor));
	return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
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

const avatarPalette = ['#BA7656', '#3975F6', '#18D09C', '#8A3FFC', '#FF4E78'];


function avatarColorFor(name: string) {
	if (!name) return '#D9D9D9';
	const sum = Array.from(name).reduce((total, char) => total + char.charCodeAt(0), 0);
	return avatarPalette[sum % avatarPalette.length];
}

type DeckCardProps = {
	accent: string;
	count: string;
	name: string;
	shapes: Shape[];
	width: `${number}%`;
	first?: boolean;
	onPress: () => void;
	onLongPress: () => void;
};

function DeckCard({ accent, count, name, shapes, width, first, onPress, onLongPress }: DeckCardProps) {
	const [size, setSize] = useState({ height: 0, width: 0 });

	return (
		<Pressable
			accessibilityHint="Segure para compartilhar, mudar a cor, renomear ou excluir"
			accessibilityLabel={`Abrir deck ${name}`}
			accessibilityRole="button"
			onLayout={(event) => {
				const { height, width: w } = event.nativeEvent.layout;
				setSize({ height, width: w });
			}}
			onLongPress={onLongPress}
			onPress={onPress}
			style={({ pressed }) => [
				styles.deckCard,
				{ backgroundColor: accent, width, marginTop: first ? 0 : -26 },
				pressed && { opacity: 0.9 },
			]}
		>
			{size.width > 0 && (
				<Svg
					height={size.height}
					pointerEvents="none"
					preserveAspectRatio="none"
					style={styles.cardSvg}
					viewBox="0 0 100 100"
					width={size.width}
				>
					{shapes.map((shape, index) => (
						<Polygon fill={shape.fill} key={index} points={shape.points} />
					))}
				</Svg>
			)}
			<Text style={styles.deckName}>{name}</Text>
			<Text style={styles.deckCount}>{count}</Text>
		</Pressable>
	);
}

const englishShapes: Shape[] = [
	{ fill: '#FFDE55', points: '-5,-5 28,-5 14,105 -5,105' },
	{ fill: '#EBBC3F', points: '58,-5 105,-5 105,105 38,105' },
	{ fill: '#E5B33A', points: '82,-5 105,-5 105,105 72,105' },
];

const frenchShapes: Shape[] = [
	{ fill: '#FF6070', points: '-5,-5 38,-5 18,105 -5,105' },
	{ fill: '#C42563', points: '48,-5 105,-5 105,105 60,105' },
	{ fill: '#B91B5A', points: '60,-5 105,-5 105,65' },
];

const italianShapes: Shape[] = [
	{ fill: '#22DB9A', points: '-5,-5 42,-5 -5,62' },
	{ fill: '#1BC98C', points: '-5,105 -5,62 55,105' },
	{ fill: '#12A878', points: '58,-5 105,-5 105,105 36,105' },
	{ fill: '#0F9C70', points: '84,-5 105,-5 105,105 76,105' },
];

const deckAccents = [colors.yellow, colors.pink, colors.green, '#8A3FFC', '#00CFFF'];
const deckShapes = [englishShapes, frenchShapes, italianShapes, englishShapes, frenchShapes];
const deckWidths = ['92%', '82%', '72%'] as const;


function getShapesForColor(color: string, templateIndex: number): Shape[] {
	const template = deckShapes[templateIndex % deckShapes.length];
	const shades = [1.18, 0.86, 0.72, 0.62];

	return template.map((shape, index) => ({
		...shape,
		fill: adjustColor(color, shades[index % shades.length]),
	}));
}

type CreateDeckModalProps = {
	onClose: () => void;
	onCreate: (name: string, color: string) => void;
	top: number;
};

function CreateDeckModal({ onClose, onCreate, top }: CreateDeckModalProps) {
	const insets = useSafeAreaInsets();
	const overlayRef = useRef<ComponentRef<typeof View>>(null);
	const cardHeight = useRef(0);
	const [shift] = useState(() => new Animated.Value(0));
	const [name, setName] = useState('');
	const [selected, setSelected] = useState<string | null>(null);

	
	useEffect(() => {
		const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
		const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

		const animateTo = (value: number) =>
			Animated.timing(shift, { duration: 220, toValue: value, useNativeDriver: true }).start();

		const showSub = Keyboard.addListener(showEvent, (event) => {
			overlayRef.current?.measureInWindow((_x, y) => {
				const cardBottom = y + top + cardHeight.current;
				const keyboardTop = event.endCoordinates.screenY;
				const needed = cardBottom - (keyboardTop - 16);

			
				const maxUp = Math.max(0, top - (Math.max(insets.top, 10) + 8));
				animateTo(-Math.min(Math.max(needed, 0), maxUp));
			});
		});
		const hideSub = Keyboard.addListener(hideEvent, () => animateTo(0));

		return () => {
			showSub.remove();
			hideSub.remove();
		};
	}, [insets.top, shift, top]);

	const canCreate = name.trim().length > 0 && selected !== null;
	const rows = [themeColors.slice(0, 5), themeColors.slice(5, 10)];

	return (
		<View collapsable={false} pointerEvents="box-none" ref={overlayRef} style={styles.overlay}>
			<Pressable accessibilityLabel="Fechar" onPress={onClose} style={StyleSheet.absoluteFill} />

			<Animated.View
				onLayout={(event) => {
					cardHeight.current = event.nativeEvent.layout.height;
				}}
				style={[styles.modalCard, { top, transform: [{ translateY: shift }] }]}
			>
				<View pointerEvents="none" style={styles.modalCircle} />

				<Pressable
					accessibilityLabel="Fechar"
					accessibilityRole="button"
					hitSlop={12}
					onPress={onClose}
					style={styles.closeButton}
				>
					<View style={[styles.closeLine, { transform: [{ rotate: '45deg' }] }]} />
					<View style={[styles.closeLine, { transform: [{ rotate: '-45deg' }] }]} />
				</Pressable>

				<Text style={styles.modalLabel}>Digite o nome do deck</Text>
				<TextInput
					maxLength={30}
					onChangeText={setName}
					onSubmitEditing={Keyboard.dismiss}
					returnKeyType="done"
					selectionColor={colors.blue}
					style={styles.input}
					value={name}
				/>

				<Text style={[styles.modalLabel, styles.themeLabel]}>Escolha o tema do deck</Text>
				<View style={styles.swatches}>
					{rows.map((row, rowIndex) => (
						<View key={rowIndex} style={styles.swatchRow}>
							{row.map((color) => {
								const isSelected = selected === color;
								return (
									<Pressable
										accessibilityLabel={`Tema ${color}`}
										accessibilityRole="button"
										accessibilityState={{ selected: isSelected }}
										key={color}
										onPress={() => setSelected(color)}
										style={[
											styles.swatch,
											{ backgroundColor: color },
											isSelected && styles.swatchSelected,
										]}
									/>
								);
							})}
						</View>
					))}
				</View>

				<Pressable
					accessibilityRole="button"
					onPress={() => {
						if (canCreate && selected) onCreate(name.trim(), selected);
					}}
					style={({ pressed }) => [
						styles.modalButton,
						!canCreate && styles.modalButtonDisabled,
						pressed && canCreate && styles.pressed,
					]}
				>
					<Text style={styles.modalButtonText}>Criar deck</Text>
				</Pressable>
			</Animated.View>
		</View>
	);
}


type DeckOptionsModalProps = {
	deck: Deck | null;
	currentColor: string;
	onClose: () => void;
	onRename: (deck: Deck, name: string) => Promise<void>;
	onChangeColor: (deck: Deck, color: string) => Promise<void>;
	onShare: (deck: Deck, friend: Person) => Promise<void>;
	onDelete: (deck: Deck) => void;
};

function DeckOptionsModal({
	deck,
	currentColor,
	onClose,
	onRename,
	onChangeColor,
	onShare,
	onDelete,
}: DeckOptionsModalProps) {
	const [mode, setMode] = useState<'menu' | 'rename' | 'color' | 'share'>('menu');
	const [name, setName] = useState('');
	const [selectedColor, setSelectedColor] = useState(currentColor);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');

	const [friends, setFriends] = useState<Person[]>([]);
	const [loadingFriends, setLoadingFriends] = useState(false);
	const [sharingId, setSharingId] = useState<number | null>(null);
	const [sharedWith, setSharedWith] = useState<number[]>([]);

	
	useEffect(() => {
		if (!deck) return;

		const reset = setTimeout(() => {
			setMode('menu');
			setName(deck.name);
			setSelectedColor(currentColor);
			setError('');
			setSaving(false);
			setFriends([]);
			setSharingId(null);
			setSharedWith([]);
		}, 0);

		return () => clearTimeout(reset);
	}, [currentColor, deck]);

	
	useEffect(() => {
		if (mode !== 'share') return;

		let active = true;
		queueMicrotask(() => {
			if (!active) return;
			setLoadingFriends(true);
			setError('');
		});

		getFriends()
			.then((list) => {
				if (active) setFriends(list);
			})
			.catch((e) => {
				if (active) setError(messageOf(e, 'Não foi possível carregar seus amigos.'));
			})
			.finally(() => {
				if (active) setLoadingFriends(false);
			});

		return () => {
			active = false;
		};
	}, [mode]);

	if (!deck) return null;

	const canSave = name.trim().length > 0 && name.trim() !== deck.name && !saving;
	const canSaveColor = selectedColor.toLowerCase() !== currentColor.toLowerCase() && !saving;
	const colorRows = [themeColors.slice(0, 5), themeColors.slice(5, 10)];

	const handleSave = async () => {
		if (!canSave) return;
		setSaving(true);
		setError('');
		try {
			await onRename(deck, name.trim());
			onClose();
		} catch (e) {
			setError(messageOf(e, 'Não foi possível renomear o deck.'));
		} finally {
			setSaving(false);
		}
	};

	const handleSaveColor = async () => {
		if (!canSaveColor) return;
		setSaving(true);
		setError('');
		try {
			await onChangeColor(deck, selectedColor);
			onClose();
		} catch (e) {
			setError(messageOf(e, 'Não foi possível mudar a cor do deck.'));
		} finally {
			setSaving(false);
		}
	};

	const confirmShare = (friend: Person) => {
		Alert.alert(
			'Compartilhar deck',
			`Enviar um pedido para ${friend.name} receber uma cópia de "${deck.name}"?`,
			[
				{ text: 'Cancelar', style: 'cancel' },
				{
					text: 'Enviar pedido',
					onPress: async () => {
						setSharingId(friend.id);
						setError('');
						try {
							await onShare(deck, friend);
							setSharedWith((current) => [...current, friend.id]);
						} catch (e) {
							setError(messageOf(e, 'Não foi possível compartilhar o deck.'));
						} finally {
							setSharingId(null);
						}
					},
				},
			],
		);
	};

	return (
		<Modal animationType="fade" onRequestClose={onClose} transparent visible>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				style={styles.optionsBackdrop}
			>
				<Pressable accessibilityLabel="Fechar" onPress={onClose} style={StyleSheet.absoluteFill} />

				<View style={styles.optionsCard}>
					<Text numberOfLines={1} style={styles.optionsTitle}>
						{deck.name}
					</Text>

					{mode === 'menu' ? (
						<>
							<Pressable
								accessibilityRole="button"
								onPress={() => setMode('share')}
								style={({ pressed }) => [styles.optionButton, pressed && styles.pressed]}
							>
								<Text style={styles.optionText}>Compartilhar com amigo</Text>
							</Pressable>

							<Pressable
								accessibilityRole="button"
								onPress={() => setMode('color')}
								style={({ pressed }) => [styles.optionButton, pressed && styles.pressed]}
							>
								<Text style={styles.optionText}>Mudar cor</Text>
							</Pressable>

							<Pressable
								accessibilityRole="button"
								onPress={() => setMode('rename')}
								style={({ pressed }) => [styles.optionButton, pressed && styles.pressed]}
							>
								<Text style={styles.optionText}>Renomear</Text>
							</Pressable>

							<Pressable
								accessibilityRole="button"
								onPress={() => onDelete(deck)}
								style={({ pressed }) => [styles.optionButton, pressed && styles.pressed]}
							>
								<Text style={[styles.optionText, { color: colors.danger }]}>Excluir deck</Text>
							</Pressable>

							<Pressable accessibilityRole="button" onPress={onClose} style={styles.cancelButton}>
								<Text style={styles.cancelText}>Cancelar</Text>
							</Pressable>
						</>
					) : mode === 'share' ? (
						<>
							<Text style={styles.optionsLabel}>Enviar pedido de compartilhamento para</Text>

							{loadingFriends ? <ActivityIndicator color={colors.blue} style={styles.shareLoader} /> : null}

							{!loadingFriends && friends.length === 0 && !error ? (
								<Text style={styles.shareEmpty}>
									Você ainda não tem amigos. Adicione alguém na aba Amigos para compartilhar decks.
								</Text>
							) : null}

							<ScrollView style={styles.shareList}>
								{friends.map((friend) => {
									const done = sharedWith.includes(friend.id);
									const busy = sharingId === friend.id;

									return (
										<Pressable
											accessibilityRole="button"
											disabled={busy || done}
											key={friend.id}
											onPress={() => confirmShare(friend)}
											style={({ pressed }) => [styles.shareRow, pressed && styles.pressed]}
										>
											<View style={[styles.shareAvatar, { backgroundColor: avatarColorFor(friend.name) }]}>
												<Text style={styles.shareAvatarText}>{friend.name.charAt(0).toUpperCase()}</Text>
											</View>
											<Text numberOfLines={1} style={styles.shareName}>
												{friend.name}
											</Text>
											{busy ? (
												<ActivityIndicator color={colors.blue} />
											) : done ? (
												<Text style={styles.shareDone}>Pedido enviado ✓</Text>
											) : null}
										</Pressable>
									);
								})}
							</ScrollView>

							{error ? <Text style={styles.optionsError}>{error}</Text> : null}

							<Pressable accessibilityRole="button" onPress={() => setMode('menu')} style={styles.cancelButton}>
								<Text style={styles.cancelText}>Voltar</Text>
							</Pressable>
						</>
					) : mode === 'color' ? (
						<>
							<Text style={styles.optionsLabel}>Escolha a nova cor</Text>

							<View style={styles.swatches}>
								{colorRows.map((row, rowIndex) => (
									<View key={rowIndex} style={styles.swatchRow}>
										{row.map((color) => {
											const isSelected = selectedColor.toLowerCase() === color.toLowerCase();
											return (
												<Pressable
													accessibilityLabel={`Cor ${color}`}
													accessibilityRole="button"
													accessibilityState={{ selected: isSelected }}
													disabled={saving}
													key={color}
													onPress={() => {
														setSelectedColor(color);
														setError('');
													}}
													style={[
														styles.swatch,
														{ backgroundColor: color },
														isSelected && styles.swatchSelected,
													]}
												/>
											);
										})}
									</View>
								))}
							</View>

							{error ? <Text style={styles.optionsError}>{error}</Text> : null}

							<Pressable
								accessibilityRole="button"
								disabled={!canSaveColor}
								onPress={handleSaveColor}
								style={({ pressed }) => [
									styles.modalButton,
									!canSaveColor && styles.modalButtonDisabled,
									pressed && canSaveColor && styles.pressed,
								]}
							>
								<Text style={styles.modalButtonText}>{saving ? 'Salvando...' : 'Salvar cor'}</Text>
							</Pressable>

							<Pressable accessibilityRole="button" onPress={() => setMode('menu')} style={styles.cancelButton}>
								<Text style={styles.cancelText}>Voltar</Text>
							</Pressable>
						</>
					) : (
						<>
							<Text style={styles.optionsLabel}>Novo nome do deck</Text>
							<TextInput
								autoFocus
								editable={!saving}
								maxLength={30}
								onChangeText={(value) => {
									setName(value);
									setError('');
								}}
								onSubmitEditing={handleSave}
								returnKeyType="done"
								selectionColor={colors.blue}
								style={styles.input}
								value={name}
							/>

							{error ? <Text style={styles.optionsError}>{error}</Text> : null}

							<Pressable
								accessibilityRole="button"
								disabled={!canSave}
								onPress={handleSave}
								style={({ pressed }) => [
									styles.modalButton,
									!canSave && styles.modalButtonDisabled,
									pressed && canSave && styles.pressed,
								]}
							>
								<Text style={styles.modalButtonText}>{saving ? 'Salvando...' : 'Salvar'}</Text>
							</Pressable>

							<Pressable accessibilityRole="button" onPress={() => setMode('menu')} style={styles.cancelButton}>
								<Text style={styles.cancelText}>Voltar</Text>
							</Pressable>
						</>
					)}
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
}

export default function DecksScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { height: screenH, width: screenW } = useWindowDimensions();
	const circleSize = 2800;
	const searchRef = useRef<ComponentRef<typeof TextInput>>(null);
	const [modalVisible, setModalVisible] = useState(false);
	const [optionsDeck, setOptionsDeck] = useState<Deck | null>(null);
	const [decks, setDecks] = useState<Deck[]>([]);
	const [userName, setUserName] = useState('');
	const [search, setSearch] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState('');

	const loadDecks = async (showLoader = false) => {
		setError('');
		if (showLoader) setIsLoading(true);
		try {
			const loaded = await getDecks();

			
			const toMigrate = loaded
				.filter((deck) => !deck.color)
				.map((deck) => ({ deck, color: deckAccents[deck.id % deckAccents.length] }));
			const results = await Promise.allSettled(
				toMigrate.map(({ deck, color }) => updateDeck(deck.id, deck.name, color)),
			);

			const migrated = new Set<number>();
			results.forEach((result, index) => {
				if (result.status === 'fulfilled') migrated.add(toMigrate[index].deck.id);
			});

			setDecks(
				loaded.map((deck) =>
					migrated.has(deck.id)
						? { ...deck, color: deckAccents[deck.id % deckAccents.length] }
						: deck,
				),
			);
		} catch (loadError) {
			setError(messageOf(loadError, 'Nao foi possivel carregar os decks.'));
		} finally {
			setIsLoading(false);
		}
	};

	useFocusEffect(
		useCallback(() => {
			void loadDecks(true);
		}, []),
	);

	const handleRefresh = async () => {
		setRefreshing(true);
		try {
			await loadDecks();
		} finally {
			setRefreshing(false);
		}
	};

	useEffect(() => {
		AsyncStorage.getItem(USER_NAME_KEY).then((saved) => setUserName(saved ?? ''));
	}, []);

	
	const colorFor = (deck: Deck) => deck.color ?? deckAccents[deck.id % deckAccents.length];

	const handleCreate = async (name: string, color: string) => {
		try {
			const createdDeck = await createDeck(name, color);
			setDecks((currentDecks) => [
				...currentDecks,
				{ ...createdDeck, color: createdDeck.color ?? color, cards: createdDeck.cards ?? [] },
			]);
			setModalVisible(false);
		} catch (saveError) {
			setError(messageOf(saveError, 'Nao foi possivel criar o deck.'));
		}
	};

	const handleRename = async (deck: Deck, name: string) => {
		
		await updateDeck(deck.id, name, colorFor(deck));
		setDecks((currentDecks) =>
			currentDecks.map((item) => (item.id === deck.id ? { ...item, name } : item)),
		);
	};

	const handleChangeColor = async (deck: Deck, color: string) => {
		await updateDeck(deck.id, deck.name, color);
		setDecks((currentDecks) =>
			currentDecks.map((item) => (item.id === deck.id ? { ...item, color } : item)),
		);
	};

	
	const handleShare = async (deck: Deck, friend: Person) => {
		try {
			await sendShareRequest(deck.id, friend.id);
		} catch (e) {
			const message = messageOf(e, '');
			if (message.includes('403')) throw new Error('Só o dono do deck pode compartilhá-lo.');
			if (message.includes('404')) throw new Error('Deck ou usuário não encontrado.');
			throw e;
		}
	};

	const handleDelete = (deck: Deck) => {
		Alert.alert(
			'Excluir deck',
			`Tem certeza que deseja excluir "${deck.name}"? Todos os cards dele serão apagados.`,
			[
				{ text: 'Cancelar', style: 'cancel' },
				{
					text: 'Excluir',
					style: 'destructive',
					onPress: async () => {
						try {
							await deleteDeck(deck.id);
							setDecks((currentDecks) => currentDecks.filter((item) => item.id !== deck.id));
							setOptionsDeck(null);
						} catch (deleteError) {
							setOptionsDeck(null);
							setError(messageOf(deleteError, 'Nao foi possivel excluir o deck.'));
						}
					},
				},
			],
		);
	};

	const query = normalize(search);
	const visibleDecks = decks
		.map((deck, originalIndex) => ({ deck, originalIndex }))
		.filter(({ deck }) => query === '' || normalize(deck.name).includes(query));

	return (
		<View style={styles.screen}>
			<View
				pointerEvents="none"
				style={[
					styles.backgroundShape,
					{
						borderRadius: circleSize / 2,
						height: circleSize,
						left: screenW * 0.37,
						top: screenH * 0.45 - circleSize / 2,
						width: circleSize,
					},
				]}
			/>
			<ScrollView
				bounces
				contentContainerStyle={[
					styles.content,
					{ paddingBottom: insets.bottom + 90, paddingTop: Math.max(insets.top, 10) + 8 },
				]}
				keyboardShouldPersistTaps="handled"
				refreshControl={
					<RefreshControl
						colors={[colors.yellow]}
						onRefresh={handleRefresh}
						progressBackgroundColor={colors.blue}
						refreshing={refreshing}
						tintColor={colors.yellow}
					/>
				}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.header}>
					<Image
						accessibilityLabel="Notificações"
						contentFit="contain"
						source={require('@/assets/images/home/NotificacaoBranca.svg')}
						style={styles.notificationIcon}
					/>
					<View style={[styles.avatar, { backgroundColor: avatarColorFor(userName) }]}>
						<Text style={styles.avatarText}>{userName.trim().charAt(0).toUpperCase()}</Text>
					</View>
				</View>

				<Pressable onPress={() => searchRef.current?.focus()} style={styles.searchBar}>
					<TextInput
						accessibilityLabel="Buscar deck"
						autoCapitalize="none"
						autoCorrect={false}
						onChangeText={setSearch}
						placeholder="Buscar deck"
						placeholderTextColor="#6F82C9"
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

				{isLoading ? <ActivityIndicator color={colors.yellow} size="large" style={styles.loader} /> : null}
				{error ? <Text style={styles.error}>{error}</Text> : null}

				{!isLoading && !error && decks.length > 0 && visibleDecks.length === 0 ? (
					<Text style={styles.error}>
						Nenhum deck encontrado para &quot;{search.trim()}&quot;.
					</Text>
				) : null}

				<View style={styles.deckList}>
					{visibleDecks.map(({ deck, originalIndex }, position) => {
						const accent = colorFor(deck);

						return (
							<DeckCard
								accent={accent}
								count={String(deck.cards?.length ?? 0).padStart(2, '0')}
								first={position === 0}
								key={deck.id}
								name={deck.name}
								onLongPress={() => setOptionsDeck(deck)}
								onPress={() =>
									router.push({
										pathname: '/deck/[id]',
										params: { id: String(deck.id), name: deck.name, color: accent },
									})
								}
								shapes={getShapesForColor(accent, deck.id)}
								width={deckWidths[originalIndex % deckWidths.length]}
							/>
						);
					})}
				</View>

				{decks.length > 0 ? (
					<Text style={styles.tip}>Segure um deck para compartilhar, mudar a cor, renomear ou excluir</Text>
				) : null}

				<Pressable
					accessibilityRole="button"
					onPress={() => setModalVisible(true)}
					style={({ pressed }) => [styles.createButton, pressed && styles.pressed]}
				>
					<Text style={styles.createButtonText}>Criar novo deck</Text>
				</Pressable>
			</ScrollView>

			{modalVisible && (
				<CreateDeckModal
					onClose={() => setModalVisible(false)}
					onCreate={handleCreate}
					top={screenH * 0.26}
				/>
			)}

			<DeckOptionsModal
				currentColor={optionsDeck ? colorFor(optionsDeck) : colors.yellow}
				deck={optionsDeck}
				onChangeColor={handleChangeColor}
				onClose={() => setOptionsDeck(null)}
				onDelete={handleDelete}
				onRename={handleRename}
				onShare={handleShare}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: { backgroundColor: colors.blue, flex: 1, overflow: 'hidden' },

	backgroundShape: {
		backgroundColor: colors.shape,
		opacity: 0.9,
		position: 'absolute',
	},

	content: { flexGrow: 1, paddingHorizontal: 16 },

	header: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingHorizontal: 8,
	},
	notificationIcon: { height: 26, width: 26 },
	avatar: {
		alignItems: 'center',
		borderColor: '#FFFFFF',
		borderRadius: 26,
		borderWidth: 3,
		elevation: 3,
		height: 50,
		justifyContent: 'center',
		width: 50,
	},
	avatarText: { color: '#FFF4E9', fontSize: 22, fontWeight: '800' },

	searchBar: {
		alignItems: 'center',
		alignSelf: 'stretch',
		backgroundColor: '#C5D3FF',
		borderRadius: 12,
		elevation: 3,
		flexDirection: 'row',
		height: 42,
		marginTop: 22,
		paddingHorizontal: 14,
		shadowColor: '#174CCB',
		shadowOpacity: 0.25,
		shadowRadius: 3,
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

	deckList: { marginBottom: 12, marginLeft: -16, marginTop: 36 },
	loader: { marginTop: 48 },
	error: { color: '#FFFFFF', fontSize: 14, marginTop: 24, textAlign: 'center' },
	tip: { color: '#DDE6FF', fontSize: 12, marginBottom: 20, textAlign: 'center' },
	deckCard: {
		borderBottomRightRadius: 20,
		borderTopRightRadius: 20,
		elevation: 4,
		height: 160,
		overflow: 'hidden',
		paddingHorizontal: 20,
		paddingTop: 14,
		position: 'relative',
		shadowColor: '#000',
		shadowOffset: { height: 3, width: 0 },
		shadowOpacity: 0.25,
		shadowRadius: 4,
	},
	cardSvg: { left: 0, position: 'absolute', top: 0 },
	deckName: { color: colors.ink, fontSize: 28, fontWeight: '900' },
	deckCount: {
		color: colors.ink,
		fontSize: 62,
		fontWeight: '900',
		lineHeight: 70,
		position: 'absolute',
		right: 22,
		top: 50,
	},

	createButton: {
		alignItems: 'center',
		alignSelf: 'flex-end',
		backgroundColor: colors.yellow,
		borderRadius: 12,
		elevation: 4,
		height: 54,
		justifyContent: 'center',
		marginTop: 'auto',
		minHeight: 54,
		shadowColor: '#163EA5',
		shadowOffset: { height: 3, width: 0 },
		shadowOpacity: 0.35,
		shadowRadius: 2,
		width: 200,
	},
	createButtonText: { color: colors.ink, fontSize: 16, fontWeight: '800' },
	pressed: { opacity: 0.75 },

	
	overlay: {
		bottom: 0,
		elevation: 20,
		left: 0,
		position: 'absolute',
		right: 0,
		top: 0,
		zIndex: 20,
	},
	modalCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 26,
		elevation: 24,
		left: 36,
		overflow: 'hidden',
		paddingBottom: 22,
		paddingHorizontal: 16,
		paddingTop: 16,
		position: 'absolute',
		right: 36,
		shadowColor: '#000',
		shadowOffset: { height: 6, width: 0 },
		shadowOpacity: 0.25,
		shadowRadius: 8,
	},
	modalCircle: {
		backgroundColor: colors.lilac,
		borderRadius: 220,
		bottom: -200,
		height: 440,
		left: -170,
		position: 'absolute',
		width: 440,
	},
	closeButton: { alignItems: 'center', height: 28, justifyContent: 'center', width: 28 },
	closeLine: {
		backgroundColor: colors.blue,
		borderRadius: 2,
		height: 3.5,
		position: 'absolute',
		width: 24,
	},
	modalLabel: { color: colors.ink, fontSize: 18, fontWeight: '800', marginTop: 14 },
	input: {
		backgroundColor: '#FFFFFF',
		borderColor: '#A9A9B8',
		borderRadius: 10,
		borderWidth: 1,
		color: colors.ink,
		fontSize: 16,
		height: 42,
		marginTop: 12,
		paddingHorizontal: 12,
	},
	themeLabel: { marginTop: 22 },
	swatches: { marginTop: 16, rowGap: 14 },
	swatchRow: { flexDirection: 'row', justifyContent: 'space-between' },
	swatch: {
		borderColor: 'transparent',
		borderRadius: 22,
		borderWidth: 3,
		height: 44,
		width: 44,
	},
	swatchSelected: { borderColor: colors.ink },
	modalButton: {
		alignItems: 'center',
		alignSelf: 'stretch',
		backgroundColor: colors.yellow,
		borderRadius: 10,
		elevation: 3,
		height: 40,
		justifyContent: 'center',
		marginTop: 28,
		shadowColor: '#B58B00',
		shadowOffset: { height: 2, width: 0 },
		shadowOpacity: 0.35,
		shadowRadius: 2,
	},
	modalButtonDisabled: { opacity: 0.55 },
	modalButtonText: { color: colors.ink, fontSize: 15, fontWeight: '800' },

	
	optionsBackdrop: {
		alignItems: 'center',
		backgroundColor: 'rgba(17, 17, 17, 0.4)',
		flex: 1,
		justifyContent: 'center',
		padding: 24,
	},
	optionsCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 24,
		maxWidth: 420,
		padding: 20,
		width: '100%',
	},
	optionsTitle: { color: colors.ink, fontSize: 22, fontWeight: '900' },
	optionsLabel: { color: colors.muted, fontSize: 14, fontWeight: '700', marginTop: 16 },
	optionsError: { color: colors.danger, fontSize: 13, marginTop: 10 },
	optionButton: {
		alignItems: 'center',
		backgroundColor: colors.lilac,
		borderRadius: 12,
		marginTop: 12,
		paddingVertical: 14,
	},
	optionText: { color: colors.ink, fontSize: 16, fontWeight: '800' },
	cancelButton: { alignItems: 'center', marginTop: 14, padding: 8 },
	cancelText: { color: colors.muted, fontSize: 14, fontWeight: '700' },

	
	shareLoader: { marginVertical: 24 },
	shareEmpty: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 14 },
	shareList: { marginTop: 8, maxHeight: 260 },
	shareRow: { alignItems: 'center', flexDirection: 'row', paddingVertical: 10 },
	shareAvatar: {
		alignItems: 'center',
		borderRadius: 20,
		height: 40,
		justifyContent: 'center',
		width: 40,
	},
	shareAvatarText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
	shareName: { color: colors.ink, flex: 1, fontSize: 16, fontWeight: '600', marginLeft: 12 },
	shareDone: { color: '#12B886', fontSize: 13, fontWeight: '800' },
});
