import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Polygon } from 'react-native-svg';

import { NotificationBell } from '@/components/NotificationBell';
import { type Deck, getDecks, USER_NAME_KEY } from '../../../services/decks';
import { getStats, getUserInfo, type Stats } from '../../../services/user';

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
const emptyStats: Stats = { streak: 0, studiedToday: false };

function adjustColor(color: string, factor: number) {
	const hex = color.replace('#', '');
	const red = Math.min(255, Math.round(parseInt(hex.slice(0, 2), 16) * factor));
	const green = Math.min(255, Math.round(parseInt(hex.slice(2, 4), 16) * factor));
	const blue = Math.min(255, Math.round(parseInt(hex.slice(4, 6), 16) * factor));
	return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}


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
	const fireRef = useRef<LottieView>(null);
	const curveSize = 1400;

	const [decks, setDecks] = useState<Deck[]>([]);
	const [userName, setUserName] = useState('');
	const [stats, setStats] = useState<Stats>(emptyStats);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		const frame = requestAnimationFrame(() => fireRef.current?.play());
		return () => cancelAnimationFrame(frame);
	}, []);


	useFocusEffect(
		useCallback(() => {
			let active = true;

			(async () => {
				setError('');

				
				const [decksResult, nameResult, statsResult, userInfoResult] = await Promise.allSettled([
					getDecks(),
					AsyncStorage.getItem(USER_NAME_KEY),
					getStats(),
					getUserInfo(),
				]);

				if (!active) return;

				if (decksResult.status === 'fulfilled') {
					setDecks(decksResult.value);
				} else {
					const reason = decksResult.reason;
					setError(reason instanceof Error ? reason.message : 'Não foi possível carregar seus decks.');
				}

				setUserName(nameResult.status === 'fulfilled' && nameResult.value ? nameResult.value : '');
				const baseStats = statsResult.status === 'fulfilled' ? statsResult.value : emptyStats;
				const currentStreak = userInfoResult.status === 'fulfilled' ? userInfoResult.value.currentStreak : baseStats.streak;
				setStats({ ...baseStats, streak: currentStreak });
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
	const hasDecks = decks.length > 0;
	const totalCards = decks.reduce((total, deck) => total + (deck.cards?.length ?? 0), 0);
	const hasCards = totalCards > 0;
	const shownDecks = pendingDecks.slice(0, 2);
	const firstName = firstNameOf(userName);
	const initial = firstName.charAt(0).toUpperCase();

	
	const weekLabels = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
	const todayIndex = (new Date().getDay() + 6) % 7;
	const previousCompletedDays = stats.studiedToday ? Math.max(stats.streak - 1, 0) : stats.streak;
	const streakDays = weekLabels.map((label, index) => {
		const isToday = index === todayIndex;
		const daysBeforeToday = todayIndex - index;
		const completed = isToday
			? stats.studiedToday
			: daysBeforeToday > 0 && daysBeforeToday <= previousCompletedDays;

		return { completed, isToday, label };
	});

	const colorFor = (deck: Deck) => deck.color ?? deckAccents[deck.id % deckAccents.length];

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
					<NotificationBell />
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
					) : !hasDecks ? (
						'Comece criando seu primeiro deck'
					) : !hasCards ? (
						'Você já tem decks. Agora adicione seus primeiros cards'
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

				
				<View accessibilityLabel={`Sua ofensiva: ${stats.streak} dias`} style={styles.streakCard}>
					<View style={styles.streakHeader}>
						<View style={styles.streakHeading}>
							<LottieView
								ref={fireRef}
								autoPlay
								loop
								resizeMode="contain"
								speed={1.5}
								source={require('@/assets/lotties/Fire animation.json')}
								style={styles.streakFire}
							/>
							<Text style={styles.streakLabel}>Sua ofensiva</Text>
						</View>
						<Text style={styles.streakCount}>{stats.streak} dias</Text>
					</View>

					<View style={styles.weekRow}>
						{streakDays.map((day, index) => (
							<View key={`${day.label}-${index}`} style={styles.weekDay}>
								<View
									style={[
										styles.dayCircle,
										day.completed && styles.dayCircleCompleted,
										day.isToday && !day.completed && styles.dayCircleToday,
										!day.completed && !day.isToday && styles.dayCircleFuture,
									]}
								>
									{day.completed ? <Text style={styles.dayCheck}>✓</Text> : null}
								</View>
								<Text style={styles.dayLabel}>{day.label}</Text>
							</View>
						))}
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

				{!loading && !error && !hasDecks ? (
					<View style={styles.emptyState}>
						<Text style={styles.emptyStateTitle}>Sua jornada começa aqui</Text>
						<Text style={styles.stateText}>Crie seu primeiro deck para organizar seus estudos e começar a revisar.</Text>
						<Pressable
							accessibilityRole="button"
							onPress={() => router.push('/drawer/decks')}
							style={({ pressed }) => [styles.emptyStateButton, pressed && styles.pressed]}
						>
							<Text style={styles.emptyStateButtonText}>Criar primeiro deck</Text>
						</Pressable>
					</View>
				) : null}

				{!loading && !error && hasDecks && !hasCards ? (
					<View style={styles.emptyState}>
						<Text style={styles.emptyStateTitle}>Seus decks estão prontos</Text>
						<Text style={styles.stateText}>Adicione cards a um deck para começar a estudar.</Text>
					</View>
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

				{hasDecks ? <Pressable
					accessibilityRole="button"
					android_ripple={undefined}
					onPress={() => router.push('/drawer/decks')}
					style={styles.seeAllButton}
				>
					<Text style={styles.seeAll}>Ver todos os decks</Text>
				</Pressable> : null}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: { backgroundColor: colors.background, flex: 1, overflow: 'hidden' },
	backgroundCurve: { backgroundColor: colors.lilac, position: 'absolute' },
	content: { paddingHorizontal: 24, paddingTop: 14 },

	profileRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
	notificationIcon: { height: 0, width: 0 },
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

	streakCard: {
		backgroundColor: colors.blue,
		borderRadius: 20,
		elevation: 5,
		height: 164,
		marginTop: 52,
		paddingHorizontal: 18,
		paddingVertical: 18,
		shadowColor: colors.blueDark,
		shadowOffset: { height: 5, width: 0 },
		shadowOpacity: 0.35,
		shadowRadius: 3,
	},
	streakHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
	streakHeading: { alignItems: 'center', flexDirection: 'row' },
	streakFire: { height: 36, marginLeft: -5, marginRight: 4, width: 36 },
	streakLabel: { color: '#DCE4FF', fontSize: 17, fontWeight: '700' },
	streakCount: { color: '#FFFFFF', fontSize: 26, fontWeight: '900' },
	weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
	weekDay: { alignItems: 'center', gap: 8 },
	dayCircle: { alignItems: 'center', borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
	dayCircleCompleted: { backgroundColor: colors.yellow },
	dayCircleToday: { borderColor: '#FFFFFF', borderWidth: 3 },
	dayCircleFuture: { backgroundColor: 'rgba(167, 194, 255, 0.38)' },
	dayCheck: { color: '#493B00', fontSize: 27, fontWeight: '800', lineHeight: 30 },
	dayLabel: { color: '#DCE4FF', fontSize: 15, fontWeight: '700' },

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
	emptyState: { alignItems: 'center', marginTop: 4 },
	emptyStateTitle: { color: colors.ink, fontSize: 18, fontWeight: '900', textAlign: 'center' },
	emptyStateButton: {
		alignItems: 'center',
		backgroundColor: colors.blue,
		borderRadius: 12,
		elevation: 3,
		justifyContent: 'center',
		marginTop: 18,
		minHeight: 46,
		paddingHorizontal: 18,
	},
	emptyStateButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
	pressed: { opacity: 0.78 },

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
