import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { type ComponentRef, useCallback, useEffect, useRef, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	useWindowDimensions,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polygon } from 'react-native-svg';
import { createDeck, deleteDeck, getDecks, updateDeck, type Deck } from '../../../services/decks';

const DECK_COLORS_KEY = 'deckColors';

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
			accessibilityHint="Segure para renomear ou excluir"
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
	const [name, setName] = useState('');
	const [selected, setSelected] = useState<string | null>(null);

	const canCreate = name.trim().length > 0 && selected !== null;
	const rows = [themeColors.slice(0, 5), themeColors.slice(5, 10)];

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			pointerEvents="box-none"
			style={styles.overlay}
		>
			
			<Pressable accessibilityLabel="Fechar" onPress={onClose} style={StyleSheet.absoluteFill} />

			<View style={[styles.modalCard, { top }]}>
				
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
			</View>
		</KeyboardAvoidingView>
	);
}


type DeckOptionsModalProps = {
	deck: Deck | null;
	onClose: () => void;
	onRename: (deck: Deck, name: string) => Promise<void>;
	onDelete: (deck: Deck) => void;
};

function DeckOptionsModal({ deck, onClose, onRename, onDelete }: DeckOptionsModalProps) {
	const [mode, setMode] = useState<'menu' | 'rename'>('menu');
	const [name, setName] = useState('');
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');

	
	useEffect(() => {
		if (deck) {
			setMode('menu');
			setName(deck.name);
			setError('');
			setSaving(false);
		}
	}, [deck]);

	if (!deck) return null;

	const canSave = name.trim().length > 0 && name.trim() !== deck.name && !saving;

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

							<Pressable
								accessibilityRole="button"
								onPress={() => setMode('menu')}
								style={styles.cancelButton}
							>
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
	const [deckColors, setDeckColors] = useState<Record<string, string>>({});
	const [search, setSearch] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState('');

	const loadDecks = async () => {
		setError('');
		try {
			setDecks(await getDecks());
		} catch (loadError) {
			setError(messageOf(loadError, 'Nao foi possivel carregar os decks.'));
		} finally {
			setIsLoading(false);
		}
	};

	
	useFocusEffect(
		useCallback(() => {
			void loadDecks();
		}, []),
	);

	
	useEffect(() => {
		AsyncStorage.getItem(DECK_COLORS_KEY).then((saved) => {
			if (saved) setDeckColors(JSON.parse(saved));
		});
	}, []);

	const handleCreate = async (name: string, color: string) => {
		try {
			const createdDeck = await createDeck(name);
			const nextColors = { ...deckColors, [String(createdDeck.id)]: color };
			setDeckColors(nextColors);
			AsyncStorage.setItem(DECK_COLORS_KEY, JSON.stringify(nextColors));
			setDecks((currentDecks) => [...currentDecks, { ...createdDeck, cards: createdDeck.cards ?? [] }]);
			setModalVisible(false);
		} catch (saveError) {
			setError(messageOf(saveError, 'Nao foi possivel criar o deck.'));
		}
	};

	
	const handleRename = async (deck: Deck, name: string) => {
		await updateDeck(deck.id, name);
		setDecks((currentDecks) =>
			currentDecks.map((item) => (item.id === deck.id ? { ...item, name } : item)),
		);
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

							const { [String(deck.id)]: _removed, ...restColors } = deckColors;
							setDeckColors(restColors);
							AsyncStorage.setItem(DECK_COLORS_KEY, JSON.stringify(restColors));

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
				bounces={false}
				contentContainerStyle={[
					styles.content,
					{ paddingBottom: insets.bottom + 90, paddingTop: Math.max(insets.top, 10) + 8 },
				]}
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.header}>
					<Image
						accessibilityLabel="Notificações"
						contentFit="contain"
						source={require('@/assets/images/home/NotificacaoBranca.svg')}
						style={styles.notificationIcon}
					/>
					<View style={styles.avatar}>
						<Text style={styles.avatarText}>J</Text>
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
					<Text style={styles.error}>Nenhum deck encontrado para "{search.trim()}".</Text>
				) : null}

				<View style={styles.deckList}>
					{visibleDecks.map(({ deck, originalIndex }, position) => {
						const accent =
							deckColors[String(deck.id)] ?? deckAccents[originalIndex % deckAccents.length];

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
								shapes={getShapesForColor(accent, originalIndex)}
								width={deckWidths[originalIndex % deckWidths.length]}
							/>
						);
					})}
				</View>

				{decks.length > 0 ? <Text style={styles.tip}>Segure um deck para renomear ou excluir</Text> : null}

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
				deck={optionsDeck}
				onClose={() => setOptionsDeck(null)}
				onDelete={handleDelete}
				onRename={handleRename}
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
		backgroundColor: '#BA7656',
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
});