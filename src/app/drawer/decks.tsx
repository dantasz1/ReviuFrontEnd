import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polygon } from 'react-native-svg';

const colors = {
	blue: '#3975F6',
	shape: '#536BCB',
	ink: '#111111',
	yellow: '#FFD33D',
	pink: '#FF3B78',
	green: '#18D09C',
};

type Shape = { fill: string; points: string };

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

export default function DecksScreen() {
	const insets = useSafeAreaInsets();
	const { height: screenH, width: screenW } = useWindowDimensions();
	const circleSize = 2800;
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

				<View style={styles.deckList}>
					<DeckCard
						first
						accent={colors.yellow}
						count="12"
						name="Inglês"
						shapes={englishShapes}
						width="92%"
					/>
					<DeckCard
						accent={colors.pink}
						count="23"
						name="Francês"
						shapes={frenchShapes}
						width="82%"
					/>
					<DeckCard
						accent={colors.green}
						count="06"
						name="Italiano"
						shapes={italianShapes}
						width="72%"
					/>
				</View>

				<Pressable
					accessibilityRole="button"
					style={({ pressed }) => [styles.createButton, pressed && styles.pressed]}
				>
					<Text style={styles.createButtonText}>Criar novo deck</Text>
				</Pressable>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: { backgroundColor: colors.blue, flex: 1, overflow: 'hidden' },

	backgroundShape: {
		backgroundColor: colors.shape,
		borderRadius: 500,
		height: 900,
		left: 150,
		opacity: 0.9,
		position: 'absolute',
		top: -100,
		width: 600,
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
});