import LottieView from 'lottie-react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Ellipse, Polygon } from 'react-native-svg';

const colors = {
	ink: '#151515',
	blue: '#3975F6',
	blueDark: '#2457C8',
	background: '#FFFFFF',
	lilac: '#F0E7FF',
	yellow: '#FFD33D',
	red: '#FF4E78',
};

type DeckCardProps = {
	name: string;
	count: string;
	color: string;
	light: string;
	dark: string;
};

function DeckCard({ name, count, color, light, dark }: DeckCardProps) {
	const [size, setSize] = useState({ height: 0, width: 0 });
	const { height: h, width: w } = size;

	return (
		<View
			onLayout={(event) => {
				const { height, width } = event.nativeEvent.layout;
				setSize({ height, width });
			}}
			style={[styles.deckCard, { backgroundColor: color }]}
		>
			{w > 0 && (
				<Svg height={h} pointerEvents="none" style={styles.cardSvg} width={w}>
					{/* círculo claro no topo */}
					<Circle cx={w * 0.3} cy={-h * 0.1} fill={light} r={w * 0.75} />
					{/* faceta escura embaixo */}
					<Polygon fill={dark} points={`${-5},${h * 0.72} ${w * 0.55},${h + 5} ${-5},${h + 5}`} />
					<Polygon fill={dark} opacity={0.55} points={`${w * 0.55},${h + 5} ${w + 5},${h * 0.7} ${w + 5},${h + 5}`} />
				</Svg>
			)}
			<Text style={styles.deckName}>{name}</Text>
			<Text style={styles.deckCount}>{count}</Text>
			<Text style={styles.deckCaption}>Cartas a revisar</Text>
		</View>
	);
}

export default function HomeScreen() {
	const insets = useSafeAreaInsets();
	const { height: screenH, width: screenW } = useWindowDimensions();
	const coinsRef = useRef<LottieView>(null);
	const curveSize = 1400;

	useEffect(() => {
		const frame = requestAnimationFrame(() => coinsRef.current?.play());
		return () => cancelAnimationFrame(frame);
	}, []);

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
					<View style={styles.avatar}>
						<Text style={styles.avatarText}>J</Text>
					</View>
				</View>

				<Text style={styles.greeting}>Olá, Jimmy</Text>
				<Text style={styles.subtitle}>
					Você tem <Text style={styles.subtitleHighlight}>3 decks pendentes</Text> para revisar
				</Text>

				{/* overflow visível: as moedas saem por cima do card, como no Figma */}
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
						<Text style={styles.coinsValue}>200</Text>
						<Text style={styles.coinsLabel}>moedas</Text>
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
						<Text style={styles.streakTitle}>Sua ofensiva atual</Text>
						<Text style={styles.streakTitle}>é de 9 dias.</Text>
					</View>
				</View>

				<View style={styles.deckHeadingRow}>
					<Text style={styles.deckHeading}>3 Decks pendentes</Text>
					<View style={styles.alertBadge}>
						<Text style={styles.alertText}>!</Text>
					</View>
				</View>

				<View style={styles.decksGrid}>
					<DeckCard color={colors.yellow} count="12" dark="#E8B93A" light="#FFDE55" name="Inglês" />
					<DeckCard color="#FF3B78" count="23" dark="#B91B5A" light="#FF6A7C" name="Francês" />
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
		backgroundColor: '#BA7656',
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

	decksGrid: { flexDirection: 'row', gap: 15 },
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