import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Ellipse, Polygon } from 'react-native-svg';

import { type Deck, getDecks, USER_NAME_KEY } from '../../../services/decks';
import { getStats, type Stats } from '../../../services/user';

const DECK_COLORS_KEY = 'deckColors';

const colors = {
	ink: '#151515',
	blue: '#3975F6',
	blueDark: '#2457C8',
	background: '#FFFFFF',
	lilac: '#F0E7FF',
	yellow: '#FFD33D',
	pink: '#FF3B78',
	green: '#18D09C',
};


const deckAccents = [colors.yellow, colors.pink, colors.green, '#8A3FFC', '#00CFFF'];
const avatarPalette = ['#BA7656', '#3975F6', '#18D09C', '#8A3FFC', '#FF4E78'];
const emptyStats: Stats = { coins: 0, streak: 0, studiedToday: false };

function adjustColor(color: string, factor: number) {
	const hex = color.replace('#', '');
	const red = Math.min(255, Math.round(parseInt(hex.slice(0, 2), 16) * factor));
	const green = Math.min(255, Math.round(parseInt(hex.slice(2, 4), 16) * factor));
	const blue = Math.min(255, Math.round(parseInt(hex.slice(4, 6), 16) * factor));
	return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

// Data de hoje no formato do backend (ex.: 2026-11-07)
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

function firstNameOf(fullName: string) {
	const first = fullName.trim().split(/\s+/)[0] ?? '';
	return first ? first.charAt(0).toUpperCase() + first.slice(1) : '';
}


function avatarColorFor(name: string) {
	if (!name) return '#D9D9D9';
	const sum = Array.from(name).reduce((total, char) => total + char.charCodeAt(0), 0);
	return avatarPalette[sum % avatarPalette.length];
}

type DeckCardProps = {
	name: string;
	count: string;
	color: string;
	light: string;
	dark: string;
	onPress: () => void;
};

function DeckCard({ name, count, color, light, dark, onPress }: DeckCardProps) {
	const [size, setSize] = useState({ height: 0, width: 0 });
	const { height: h, width: w } = size;

	return (
		<Pressable
			accessibilityLabel={`Abrir deck ${name}`}
			accessibilityRole="button"
			onLayout={(event) => {
				const { height, width } = event.nativeEvent.layout;
				setSize({ height, width });
			}}
			onPress={onPress}
			style={({ pressed }) => [styles.deckCard, { backgroundColor: color }, pressed && { opacity: 0.9 }]}
		>
			{w > 0 && (
				<Svg height={h} pointerEvents="none" style={styles.cardSvg} width={w}>
					
					<Circle cx={w * 0.3} cy={-h * 0.1} fill={light} r={w * 0.75} />
					
					<Polygon fill={dark} points={`${-5},${h * 0.72} ${w * 0.55},${h + 5} ${-5},${h + 5}`} />
					<Polygon fill={dark} opacity={0.55} points={`${w * 0.55},${h + 5} ${w + 5},${h * 0.7} ${w + 5},${h + 5}`} />
				</Svg>
			)}
			<Text numberOfLines={1} style={styles.deckName}>
				{name}
			</Text>
			<Text style={styles.deckCount}>{count}</Text>
			<Text style={styles.deckCaption}>Cartas a revisar</Text>
		</Pressable>
	);
}

export default function HomeScreen() {
	const insets = useSafeAreaInsets();
	const { height: screenH, width: screenW } = useWindowDimensions();
	const coinsRef = useRef<LottieView>(null);
	const curveSize = 1400;

	const [decks, setDecks] = useState<Deck[]>([]);
	const [deckColors, setDeckColors] = useState<Record<string, string>>({});
	const [userName, setUserName] = useState('');
	const [stats, setStats] = useState<Stats>(emptyStats);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		const frame = requestAnimationFrame(() => coinsRef.current?.play());
		return () => cancelAnimationFrame(frame);
	}, []);

	
	useFocusEffect(
		useCallback(() => {
			let active = true;

			(async () => {
				setError('');

				
				const [decksResult, colorsResult, nameResult, statsResult] = await Promise.allSettled([
					getDecks(),
					AsyncStorage.getItem(DECK_COLORS_KEY),
					AsyncStorage.getItem(USER_NAME_KEY),
					getStats(),
				]);

				if (!active) return;

				if (decksResult.status === 'fulfilled') {
					setDecks(decksResult.value);
				} else {
					const reason = decksResult.reason;
					setError(reason instanceof Error ? reason.message : 'Não foi possível carregar seus decks.');
				}

				if (colorsResult.status === 'fulfilled' && colorsResult.value) {
					try {
						setDeckColors(JSON.parse(colorsResult.value));
					} catch {
						setDeckColors({});
					}
				}

				setUserName(nameResult.status === 'fulfilled' && nameResult.value ? nameResult.value : '');
				setStats(statsResult.status === 'fulfilled' ? statsResult.value : emptyStats);
				setLoading(false);
			})();

			return () => {
				active = false;
			};
		}, []),
	);

	
	const pendingDecks = decks
		.map((deck) => ({ deck, due: countDue(deck) }))
		.filter((item) => item.due > 0)
		.sort((a, b) => b.due - a.due);

	const pendingCount = pendingDecks.length;
	const shownDecks = pendingDecks.slice(0, 2);
	const firstName = firstNameOf(userName);
	const initial = firstName.charAt(0).toUpperCase();

	
	const colorFor = (deck: Deck) =>
		deck.color ?? deckColors[String(deck.id)] ?? deckAccents[deck.id % deckAccents.length];

	const openDeck = (deck: Deck, accent: string) =>
		router.push({
			pathname: '/deck/[id]',
			params: { id: String(deck.id), name: deck.name, color: accent },
		});

	return (
		<View style={styles.screen}>
			<View
				pointerEvents="none"
				style={[
					styles.backgroundCurve,
					{
						borderRadius: curveSize / 2,
						height: curveSize,
						left: screenW * 0.75 - curveSize,
						top: screenH * 0.45 - curveSize / 2,
						width: curveSize,
					},
				]}
			/>
			<ScrollView
				contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 98 }]}
				showsVerticalScrollIndicator={false}
			>
				<View style={[styles.profileRow, { paddingTop: Math.max(insets.top, 10) }]}>
					<Image
						accessibilityLabel="Notificações"
						contentFit="contain"
						source={require('@/assets/images/home/NotificacaoAzul.svg')}
						style={styles.notificationIcon}
					/>
					<View style={[styles.avatar, { backgroundColor: avatarColorFor(userName) }]}>
						<Text style={styles.avatarText}>{initial}</Text>
					</View>
				</View>

				<Text style={styles.greeting}>{firstName ? `Olá, ${firstName}` : 'Olá'}</Text>
				<Text style={styles.subtitle}>
					{loading ? (
						' '
					) : pendingCount > 0 ? (
						<>
							Você tem{' '}
							<Text style={styles.subtitleHighlight}>
								{pendingCount} {pendingCount === 1 ? 'deck pendente' : 'decks pendentes'}
							</Text>{' '}
							para revisar
						</>
					) : (
						'Você está em dia com as revisões 🎉'
					)}
				</Text>

				
				<View style={styles.coinsCard}>
					<View pointerEvents="none" style={styles.coinsClip}>
						<Svg height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" width="100%">
							<Ellipse cx={50} cy={115} fill={colors.blueDark} rx={80} ry={65} />
						</Svg>
					</View>
					<LottieView
						ref={coinsRef}
						autoPlay
						loop
						speed={1.5}
						source={require('@/assets/lotties/Animated Coins.json')}
						style={styles.coinsAnimation}
					/>
					<View style={styles.coinsCopy}>
						<Text style={styles.coinsLabel}>Você possui</Text>
						<Text style={styles.coinsValue}>{stats.coins}</Text>
						<Text style={styles.coinsLabel}>{stats.coins === 1 ? 'moeda' : 'moedas'}</Text>
					</View>
				</View>

				<View style={styles.streakRow}>
					<LottieView
						autoPlay
						loop
						source={require('@/assets/lotties/Businessman flies up with rocket.json')}
						style={styles.streakAnimation}
					/>
					<View style={styles.streakCopy}>
						{stats.streak > 0 ? (
							<>
								<Text style={styles.streakTitle}>Sua ofensiva atual</Text>
								<Text style={styles.streakTitle}>
									é de {stats.streak} {stats.streak === 1 ? 'dia' : 'dias'}.
								</Text>
							</>
						) : (
							<>
								<Text style={styles.streakTitle}>Estude hoje para</Text>
								<Text style={styles.streakTitle}>começar sua ofensiva.</Text>
							</>
						)}
					</View>
				</View>

				{pendingCount > 0 ? (
					<View style={styles.deckHeadingRow}>
						<Text style={styles.deckHeading}>
							{pendingCount} {pendingCount === 1 ? 'Deck pendente' : 'Decks pendentes'}
						</Text>
						<View style={styles.alertBadge}>
							<Text style={styles.alertText}>!</Text>
						</View>
					</View>
				) : null}

				{loading ? <ActivityIndicator color={colors.blue} style={styles.state} /> : null}
				{error ? <Text style={styles.stateText}>{error}</Text> : null}

				{!loading && !error && decks.length === 0 ? (
					<Text style={styles.stateText}>Você ainda não tem decks. Crie o primeiro na aba Decks.</Text>
				) : null}

				<View style={styles.decksGrid}>
					{shownDecks.map(({ deck, due }) => {
						const accent = colorFor(deck);

						return (
							<DeckCard
								color={accent}
								count={String(due).padStart(2, '0')}
								dark={adjustColor(accent, 0.72)}
								key={deck.id}
								light={adjustColor(accent, 1.18)}
								name={deck.name}
								onPress={() => openDeck(deck, accent)}
							/>
						);
					})}
					
					{shownDecks.length === 1 ? <View style={styles.deckSpacer} /> : null}
				</View>

				<Pressable
					accessibilityRole="button"
					android_ripple={undefined}
					onPress={() => router.push('/drawer/decks')}
					style={styles.seeAllButton}
				>
					<Text style={styles.seeAll}>Ver todos os decks</Text>
				</Pressable>
			</ScrollView>
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
		shadowColor: '#777',
		shadowOpacity: 0.22,
		shadowRadius: 4,
		width: 52,
	},
	avatarText: { color: '#FFF4E9', fontSize: 22, fontWeight: '800' },

	greeting: { color: colors.ink, fontSize: 32, fontWeight: '900', marginTop: 22 },
	subtitle: { color: colors.ink, fontSize: 16, fontWeight: '600', marginTop: 4 },
	subtitleHighlight: { color: '#F12764', fontWeight: '900' },

	coinsCard: {
		alignItems: 'center',
		backgroundColor: colors.blue,
		borderRadius: 16,
		elevation: 5,
		flexDirection: 'row',
		height: 112,
		marginTop: 52,
		paddingLeft: 12,
		shadowColor: colors.blueDark,
		shadowOffset: { height: 5, width: 0 },
		shadowOpacity: 0.35,
		shadowRadius: 3,
	},
	coinsClip: { ...StyleSheet.absoluteFill, borderRadius: 16, overflow: 'hidden' },
	coinsAnimation: { height: 150, marginTop: -38, width: 190 },
	coinsCopy: { alignItems: 'flex-end', flex: 1, paddingRight: 18 },
	coinsLabel: { color: '#DCE4FF', fontSize: 15, fontWeight: '600' },
	coinsValue: { color: '#FFFFFF', fontSize: 40, fontWeight: '900', lineHeight: 44 },

	streakRow: { alignItems: 'center', flexDirection: 'row', height: 120, marginTop: 14 },
	streakAnimation: { height: 130, marginLeft: -14, width: 200 },
	streakCopy: { flex: 1, paddingRight: 7 },
	streakTitle: { color: colors.ink, fontSize: 18, fontWeight: '900', textAlign: 'right' },

	deckHeadingRow: { alignItems: 'center', flexDirection: 'row', gap: 5, marginBottom: 16, marginTop: 5 },
	deckHeading: { color: colors.ink, fontSize: 17, fontWeight: '700' },
	alertBadge: {
		alignItems: 'center',
		borderColor: '#FF315C',
		borderRadius: 11,
		borderWidth: 2,
		height: 22,
		justifyContent: 'center',
		width: 22,
	},
	alertText: { color: '#FF315C', fontSize: 14, fontWeight: '900' },

	state: { marginTop: 24 },
	stateText: { color: '#5A5A66', fontSize: 14, marginTop: 20, textAlign: 'center' },

	decksGrid: { flexDirection: 'row', gap: 15 },
	deckSpacer: { flex: 1 },
	deckCard: {
		borderRadius: 16,
		elevation: 4,
		flex: 1,
		height: 190,
		overflow: 'hidden',
		padding: 14,
		shadowColor: '#000',
		shadowOffset: { height: 3, width: 0 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
	},
	cardSvg: { left: 0, position: 'absolute', top: 0 },
	deckName: { color: colors.ink, fontSize: 22, fontWeight: '900' },
	deckCount: { color: colors.ink, fontSize: 60, fontWeight: '900', marginTop: 22, textAlign: 'center' },
	deckCaption: { color: colors.ink, fontSize: 14, fontWeight: '700', marginTop: 12, textAlign: 'center' },

	seeAllButton: { alignSelf: 'flex-end', backgroundColor: 'transparent', marginTop: 21 },
	seeAll: { color: colors.ink, fontSize: 15, fontWeight: '800', textAlign: 'right' },
});