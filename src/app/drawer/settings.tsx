import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const colors = {
	ink: '#151515',
	background: '#FFFFFF',
	lilac: '#F0E7FF',
	menu: '#4C69D0',
	menuShadow: '#2E45A3',
	logout: '#B91B5A',
};

type MenuItem = { id: string; label: string; showBell?: boolean };

const menuItems: MenuItem[] = [
	{ id: 'profile', label: 'Perfil' },
	{ id: 'notifications', label: 'Notificações', showBell: true },
	{ id: 'terms', label: 'Termos de serviço' },
	{ id: 'blocked', label: 'Contas bloqueadas' },
	{ id: 'support', label: 'Suporte' },
];

export default function SettingsScreen() {
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
						left: screenW * 0.1 - curveSize / 2,
						top: screenH * 0.77 - curveSize,
						width: curveSize,
					},
				]}
			/>

			<ScrollView
				bounces={false}
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

				<Text style={styles.title}>Configurações</Text>

				<View style={styles.menu}>
					{menuItems.map((item) => (
						<Pressable
							accessibilityRole="button"
							key={item.id}
							style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
						>
							<Text style={styles.menuText}>{item.label}</Text>
							{item.showBell && (
								<Image
									contentFit="contain"
									source={require('@/assets/images/home/NotificacaoBranca.svg')}
									style={styles.menuBell}
								/>
							)}
						</Pressable>
					))}
				</View>

				<Pressable
					accessibilityRole="button"
					style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
				>
					<Text style={styles.menuText}>Sair da conta</Text>
				</Pressable>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: { backgroundColor: colors.background, flex: 1, overflow: 'hidden' },
	backgroundCurve: { backgroundColor: colors.lilac, position: 'absolute' },

	
	content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 14 },

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

	title: { color: colors.ink, fontSize: 30, fontWeight: '900', marginTop: 22 },

	menu: { gap: 14, marginTop: 26 },
	menuItem: {
		alignItems: 'center',
		backgroundColor: colors.menu,
		borderRadius: 10,
		elevation: 4,
		flexDirection: 'row',
		height: 52,
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		shadowColor: colors.menuShadow,
		shadowOffset: { height: 3, width: 0 },
		shadowOpacity: 0.35,
		shadowRadius: 3,
	},
	menuText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
	menuBell: { height: 22, width: 22 },

	logoutButton: {
		alignItems: 'flex-start',
		backgroundColor: colors.logout,
		borderRadius: 10,
		elevation: 4,
		height: 52,
		justifyContent: 'center',
		marginTop: 'auto',
		paddingHorizontal: 16,
		shadowColor: '#6E0F36',
		shadowOffset: { height: 3, width: 0 },
		shadowOpacity: 0.35,
		shadowRadius: 3,
	},
	pressed: { opacity: 0.75 },
});