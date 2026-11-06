import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	KeyboardAvoidingView,
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
import { createDeck, getDecks, type Deck } from '../../../services/decks';

const DECK_COLORS_KEY = 'deckColors';

const colors = {
	blue: '#3975F6',
	shape: '#536BCB',
	ink: '#111111',
	yellow: '#FFD33D',
	pink: '#FF3B78',
	green: '#18D09C',
	lilac: '#F0E7FF',
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

type DeckCardProps = {
	accent: string;
	count: string;
	name: string;
	shapes: Shape[];
	width: `${number}%`;
	first?: boolean;
};

function DeckCard({ accent, count, name, shapes, width, first }: DeckCardProps) {
	const [size, setSize] = useState({ height: 0, width: 0 });

	return (
		<View
			onLayout={(event) => {
				const { height, width: w } = event.nativeEvent.layout;
				setSize({ height, width: w });
			}}
			style={[
				styles.deckCard,
				{ backgroundColor: accent, width, marginTop: first ? 0 : -26 },
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
		</View>
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

// As faixas sempre são geradas a partir da cor do card (em tons mais claros e escuros)
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
			{/* Toque fora do cartão fecha o modal */}
			<Pressable accessibilityLabel="Fechar" onPress={onClose} style={StyleSheet.absoluteFill} />

			<View style={[styles.modalCard, { top }]}>
				{/* Círculo lilás decorativo no fundo do cartão */}
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

export default function DecksScreen() {
	const insets = useSafeAreaInsets();
	const { height: screenH, width: screenW } = useWindowDimensions();
	const circleSize = 2800;
	const [modalVisible, setModalVisible] = useState(false);
	const [decks, setDecks] = useState<Deck[]>([]);
	const [deckColors, setDeckColors] = useState<Record<string, string>>({});
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState('');

	const loadDecks = async () => {
		setError('');
		try {
			setDecks(await getDecks());
		} catch (loadError) {
			setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar os decks.');
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		// A carga inicial sincroniza a tela com a API quando a rota é montada.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		void loadDecks();
	}, []);

	// Recupera as cores escolhidas pelo usuário (ficam salvas no aparelho)
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
			setError(saveError instanceof Error ? saveError.message : 'Nao foi possivel criar o deck.');
		}
	};

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

				<Pressable accessibilityRole="search" style={styles.searchBar}>
					<View style={styles.searchIcon} />
					<View style={styles.searchHandle} />
				</Pressable>

				{isLoading ? <ActivityIndicator color={colors.yellow} size="large" style={styles.loader} /> : null}
				{error ? <Text style={styles.error}>{error}</Text> : null}

				<View style={styles.deckList}>
					{decks.map((deck, index) => {
						const accent = deckColors[String(deck.id)] ?? deckAccents[index % deckAccents.length];

						return (
							<DeckCard
								accent={accent}
								count={String(deck.cards?.length ?? 0).padStart(2, '0')}
								first={index === 0}
								key={deck.id}
								name={deck.name}
								shapes={getShapesForColor(accent, index)}
								width={deckWidths[index % deckWidths.length]}
							/>
						);
					})}
				</View>

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
		justifyContent: 'flex-end',
		marginTop: 22,
		paddingRight: 16,
		shadowColor: '#174CCB',
		shadowOpacity: 0.25,
		shadowRadius: 3,
	},
	searchIcon: { borderColor: colors.blue, borderRadius: 10, borderWidth: 2.5, height: 18, width: 18 },
	searchHandle: {
		backgroundColor: colors.blue,
		borderRadius: 2,
		height: 3,
		marginLeft: -2,
		marginTop: 16,
		transform: [{ rotate: '45deg' }],
		width: 8,
	},

	deckList: { marginBottom: 32, marginLeft: -16, marginTop: 36 },
	loader: { marginTop: 48 },
	error: { color: '#FFFFFF', fontSize: 14, marginTop: 24, textAlign: 'center' },
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

	// ---------- Modal ----------
	// elevation/zIndex altos para ficar acima dos cards (que têm elevation no Android)
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
});