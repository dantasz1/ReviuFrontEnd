import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { logout } from '../../../services/auth';
import { USER_NAME_KEY } from '../../../services/decks';

const colors = {
	ink: '#151515',
	background: '#FFFFFF',
	lilac: '#F0E7FF',
	menu: '#4C69D0',
	menuShadow: '#2E45A3',
	logout: '#B91B5A',
};

const avatarPalette = ['#BA7656', '#3975F6', '#18D09C', '#8A3FFC', '#FF4E78'];


function avatarColorFor(name: string) {
	if (!name) return '#D9D9D9';
	const sum = Array.from(name).reduce((total, char) => total + char.charCodeAt(0), 0);
	return avatarPalette[sum % avatarPalette.length];
}

type MenuItem = { id: string; label: string; showBell?: boolean; href?: Href };

const menuItems: MenuItem[] = [
	{ id: 'profile', label: 'Perfil', href: '/drawer/profile' as Href },
	{ id: 'notifications', label: 'Notificações', showBell: true },
	{ id: 'terms', label: 'Termos de serviço' },
	{ id: 'blocked', label: 'Contas bloqueadas' },
	{ id: 'support', label: 'Suporte' },
];


function confirmLogout(onConfirm: () => void) {
	if (Platform.OS === 'web') {
		if (window.confirm('Tem certeza que deseja sair da conta?')) onConfirm();
		return;
	}

	Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
		{ text: 'Cancelar', style: 'cancel' },
		{ text: 'Sair', style: 'destructive', onPress: onConfirm },
	]);
}

export default function SettingsScreen() {
	const insets = useSafeAreaInsets();
	const { height: screenH, width: screenW } = useWindowDimensions();
	const curveSize = 1400;
	const [userName, setUserName] = useState('');

	useFocusEffect(
		useCallback(() => {
			AsyncStorage.getItem(USER_NAME_KEY).then((saved) => setUserName(saved ?? ''));
		}, []),
	);

	const initial = userName.trim().charAt(0).toUpperCase();

	const handleLogout = () => {
		confirmLogout(async () => {
			await logout();
			router.replace('/auth/login');
		});
	};

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
					<Pressable
						accessibilityLabel="Abrir perfil"
						accessibilityRole="button"
						hitSlop={8}
						onPress={() => router.push('/drawer/profile' as Href)}
						style={({ pressed }) => [
							styles.avatar,
							{ backgroundColor: avatarColorFor(userName) },
							pressed && styles.pressed,
						]}
					>
						<Text style={styles.avatarText}>{initial}</Text>
					</Pressable>
				</View>

				<Text style={styles.title}>Configurações</Text>

				<View style={styles.menu}>
					{menuItems.map((item) => (
						<Pressable
							accessibilityRole="button"
							key={item.id}
							onPress={() => {
								if (item.href) router.push(item.href);
							}}
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
					onPress={handleLogout}
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