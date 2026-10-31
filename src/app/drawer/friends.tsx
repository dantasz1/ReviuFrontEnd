import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const colors = {
	ink: '#151515',
	muted: '#5A5A66',
	blue: '#3975F6',
	background: '#FFFFFF',
	lilac: '#F0E7FF',
	pink: '#FF3B78',
};

type Friend = {
	id: string;
	name: string;
	message: string;
	time: string;
	unread?: number;
	avatarColor: string;
	youSent?: boolean;
};

const friends: Friend[] = [
	{ id: '1', name: 'Catarina', message: 'Já estudou hoje?', time: '23 min', unread: 2, avatarColor: '#C4574B' },
	{ id: '2', name: 'Marcos', message: 'Me manda seu deck de inglês ...', time: '53 min', unread: 1, avatarColor: '#7A8CA5' },
	{ id: '3', name: 'Jéssica', message: 'Obrigado pelas dicas! 👍', time: '2 horas', avatarColor: '#D9A441', youSent: true },
	{ id: '4', name: 'José', message: 'Tudo bem com vc?', time: '5 horas', avatarColor: '#8A5A3C' },
];

function FriendRow({ friend }: { friend: Friend }) {
	return (
		<Pressable
			accessibilityRole="button"
			style={({ pressed }) => [styles.row, pressed && styles.pressed]}
		>
			<View style={[styles.friendAvatar, { backgroundColor: friend.avatarColor }]}>
				<Text style={styles.friendAvatarText}>{friend.name.charAt(0)}</Text>
			</View>

			<View style={styles.rowBody}>
				<Text style={styles.friendName}>{friend.name}</Text>
				<Text numberOfLines={1} style={styles.friendMessage}>
					{friend.youSent && <Text style={styles.youLabel}>Você: </Text>}
					{friend.message}
				</Text>
			</View>

			<View style={styles.rowMeta}>
				<Text style={styles.time}>{friend.time}</Text>
				{friend.unread ? (
					<View style={styles.badge}>
						<Text style={styles.badgeText}>{friend.unread}</Text>
					</View>
				) : (
					<View style={styles.badgePlaceholder} />
				)}
			</View>
		</Pressable>
	);
}

export default function FriendsScreen() {
	const insets = useSafeAreaInsets();
	const { height: screenH, width: screenW } = useWindowDimensions();
	const curveSize = 1400;

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

				<View style={styles.titleRow}>
					<Text style={styles.title}>Amigos</Text>
					<Pressable
						accessibilityLabel="Adicionar amigo"
						accessibilityRole="button"
						style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
					>
						<View style={styles.plusHorizontal} />
						<View style={styles.plusVertical} />
					</Pressable>
				</View>

				<Pressable accessibilityRole="search" style={styles.searchBar}>
					<View style={styles.searchIcon} />
					<View style={styles.searchHandle} />
				</Pressable>

				<Text style={styles.sectionTitle}>Mensagens</Text>

				<View style={styles.list}>
					{friends.map((friend) => (
						<FriendRow friend={friend} key={friend.id} />
					))}
				</View>
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

	titleRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
	title: { color: colors.ink, fontSize: 32, fontWeight: '900' },
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
		justifyContent: 'flex-end',
		marginTop: 22,
		paddingRight: 16,
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

	sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '800', marginTop: 28 },

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
		width: 52,
	},
	friendAvatarText: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
	rowBody: { flex: 1, marginLeft: 14, marginRight: 8 },
	friendName: { color: colors.ink, fontSize: 20, fontWeight: '500' },
	friendMessage: { color: colors.ink, fontSize: 13, fontWeight: '500', marginTop: 2 },
	youLabel: { color: colors.muted, fontWeight: '500' },

	rowMeta: { alignItems: 'flex-end', alignSelf: 'stretch', justifyContent: 'space-between', paddingVertical: 2 },
	time: { color: colors.ink, fontSize: 12, fontWeight: '500' },
	badge: {
		alignItems: 'center',
		backgroundColor: colors.pink,
		borderRadius: 11,
		height: 22,
		justifyContent: 'center',
		minWidth: 22,
		paddingHorizontal: 6,
	},
	badgeText: { color: '#111111', fontSize: 12, fontWeight: '800' },
	badgePlaceholder: { height: 22 },
});