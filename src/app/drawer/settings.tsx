import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import {
	Alert,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NotificationBell } from '@/components/NotificationBell';
import { useAppViewport } from '@/hooks/use-app-viewport';
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
const SUPPORT_EMAIL = 'suporte.decko@gmail.com';


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
	const { height: screenH, width: screenW } = useAppViewport();
	const curveSize = 1400;
	const [userName, setUserName] = useState('');
	const [supportVisible, setSupportVisible] = useState(false);
	const [supportSubject, setSupportSubject] = useState('Ajuda com o Reviu');
	const [supportMessage, setSupportMessage] = useState('');

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

	const handleSendSupport = async () => {
		if (!supportMessage.trim()) {
			Alert.alert('Mensagem vazia', 'Escreva uma mensagem antes de enviar.');
			return;
		}

		const emailUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
			supportSubject.trim() || 'Ajuda com o Reviu',
		)}&body=${encodeURIComponent(supportMessage.trim())}`;

		try {
			await Linking.openURL(emailUrl);
			setSupportVisible(false);
			setSupportMessage('');
		} catch {
			Alert.alert(
				'Não foi possível abrir o e-mail',
				'Configure um aplicativo de e-mail no dispositivo e tente novamente.',
			);
		}
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
								if (item.href) {
									router.push(item.href);
								} else if (item.id === 'notifications') {
									router.push('/drawer/notifications');
								} else if (item.id === 'blocked') {
									router.push('/drawer/blocked' as Href);
								} else if (item.id === 'support') {
									setSupportVisible(true);
								}
							}}
							style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
						>
							<Text style={styles.menuText}>{item.label}</Text>
							{item.showBell && (
								<NotificationBell interactive={false} variant="white" />
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

			<Modal
				animationType="slide"
				onRequestClose={() => setSupportVisible(false)}
				transparent
				visible={supportVisible}
			>
				<KeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : undefined}
					style={styles.modalBackdrop}
				>
					<View style={styles.supportCard}>
						<Text style={styles.supportTitle}>Fale com o suporte</Text>
						<Text style={styles.supportDescription}>
							Sua mensagem será enviada para {SUPPORT_EMAIL}.
						</Text>

						<TextInput
							accessibilityLabel="Assunto"
							maxLength={120}
							onChangeText={setSupportSubject}
							placeholder="Assunto"
							placeholderTextColor="#777"
							style={styles.supportInput}
							value={supportSubject}
						/>
						<TextInput
							accessibilityLabel="Mensagem"
							maxLength={4000}
							multiline
							onChangeText={setSupportMessage}
							placeholder="Digite sua mensagem"
							placeholderTextColor="#777"
							style={[styles.supportInput, styles.supportMessageInput]}
							textAlignVertical="top"
							value={supportMessage}
						/>

						<View style={styles.supportActions}>
							<Pressable
								accessibilityRole="button"
								onPress={() => setSupportVisible(false)}
								style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
							>
								<Text style={styles.cancelButtonText}>Cancelar</Text>
							</Pressable>
							<Pressable
								accessibilityRole="button"
								onPress={handleSendSupport}
								style={({ pressed }) => [styles.sendButton, pressed && styles.pressed]}
							>
								<Text style={styles.menuText}>Enviar</Text>
							</Pressable>
						</View>
					</View>
				</KeyboardAvoidingView>
			</Modal>
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
	modalBackdrop: { backgroundColor: 'rgba(0, 0, 0, 0.45)', flex: 1, justifyContent: 'flex-end' },
	supportCard: {
		backgroundColor: colors.background,
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		padding: 24,
		paddingBottom: 32,
	},
	supportTitle: { color: colors.ink, fontSize: 24, fontWeight: '900' },
	supportDescription: { color: '#555', fontSize: 14, marginTop: 8 },
	supportInput: {
		borderColor: '#D8D8D8',
		borderRadius: 10,
		borderWidth: 1,
		color: colors.ink,
		fontSize: 16,
		marginTop: 16,
		minHeight: 50,
		paddingHorizontal: 14,
		paddingVertical: 12,
	},
	supportMessageInput: { minHeight: 140 },
	supportActions: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end', marginTop: 18 },
	cancelButton: { alignItems: 'center', justifyContent: 'center', minHeight: 48, paddingHorizontal: 16 },
	cancelButtonText: { color: colors.menu, fontSize: 16, fontWeight: '800' },
	sendButton: {
		alignItems: 'center',
		backgroundColor: colors.menu,
		borderRadius: 10,
		justifyContent: 'center',
		minHeight: 48,
		paddingHorizontal: 22,
	},
});
