import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { requestPasswordReset } from '../../../services/auth';
import { USER_NAME_KEY } from '../../../services/decks';
import { getUserInfo, type UserInfo } from '../../../services/user';

const colors = {
	ink: '#151515',
	background: '#FFFFFF',
	lilac: '#F0E7FF',
	menu: '#4C69D0',
	menuShadow: '#2E45A3',
	label: '#DCE4FF',
	danger: '#B91B5A',
};

const avatarPalette = ['#BA7656', '#3975F6', '#18D09C', '#8A3FFC', '#FF4E78'];

function avatarColorFor(name: string) {
	if (!name) return '#D9D9D9';
	const sum = Array.from(name).reduce((total, char) => total + char.charCodeAt(0), 0);
	return avatarPalette[sum % avatarPalette.length];
}

export default function ProfileScreen() {
	const insets = useSafeAreaInsets();
	const { height: screenH, width: screenW } = useWindowDimensions();
	const curveSize = 1400;

	const [info, setInfo] = useState<UserInfo | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [sendingReset, setSendingReset] = useState(false);
	const [resetError, setResetError] = useState('');

	const loadInfo = useCallback(async () => {
		setError('');
		setLoading(true);
		try {
			setInfo(await getUserInfo());
		} catch (e) {
			
			const savedName = await AsyncStorage.getItem(USER_NAME_KEY);
			setInfo(savedName ? { name: savedName, username: '', email: '' } : null);
			setError(e instanceof Error ? e.message : 'Não foi possível carregar seu perfil.');
		} finally {
			setLoading(false);
		}
	}, []);

	useFocusEffect(
		useCallback(() => {
			void loadInfo();
		}, [loadInfo]),
	);

	const handleResetPassword = async () => {
		if (!info?.email || sendingReset) return;

		setResetError('');
		setSendingReset(true);
		try {
			await requestPasswordReset(info.email);
			router.push('/auth/reset-password');
		} catch (e) {
			setResetError(e instanceof Error ? e.message : 'Não foi possível enviar o código.');
		} finally {
			setSendingReset(false);
		}
	};

	const name = info?.name ?? '';
	const canReset = Boolean(info?.email) && !sendingReset;

	const rows = [
		{ label: 'Nome', value: info?.name },
		{ label: 'Usuário', value: info?.username ? `@${info.username}` : '' },
		{ label: 'E-mail', value: info?.email },
	];

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
				<View style={[styles.topRow, { paddingTop: Math.max(insets.top, 10) }]}>
					<Pressable
						accessibilityLabel="Voltar"
						accessibilityRole="button"
						hitSlop={8}
						onPress={() => (router.canGoBack() ? router.back() : router.replace('/drawer/settings'))}
						style={styles.backButton}
					>
						<Image contentFit="contain" source={require('@/assets/images/Left.svg')} style={styles.backIcon} />
					</Pressable>
				</View>

				<Text style={styles.title}>Perfil</Text>

				{loading ? <ActivityIndicator color={colors.menu} style={styles.loader} /> : null}

				{!loading ? (
					<>
						<View style={styles.avatarWrap}>
							<View style={[styles.avatar, { backgroundColor: avatarColorFor(name) }]}>
								<Text style={styles.avatarText}>{name.trim().charAt(0).toUpperCase()}</Text>
							</View>
						</View>

						{error ? (
							<View style={styles.errorBox}>
								<Text style={styles.errorText}>{error}</Text>
								<Pressable accessibilityRole="button" onPress={loadInfo}>
									<Text style={styles.retry}>Tentar de novo</Text>
								</Pressable>
							</View>
						) : null}

						<View style={styles.list}>
							{rows.map((row) => (
								<View key={row.label} style={styles.infoItem}>
									<Text style={styles.infoLabel}>{row.label}</Text>
									<Text numberOfLines={1} style={styles.infoValue}>
										{row.value || '—'}
									</Text>
								</View>
							))}
						</View>

						<Pressable
							accessibilityRole="button"
							disabled={!canReset}
							onPress={handleResetPassword}
							style={({ pressed }) => [
								styles.resetButton,
								!canReset && styles.disabled,
								pressed && styles.pressed,
							]}
						>
							<Text style={styles.resetText}>
								{sendingReset ? 'Enviando código...' : 'Redefinir senha'}
							</Text>
						</Pressable>
						<Text style={styles.hint}>Enviaremos um código para o seu e-mail.</Text>
						{resetError ? <Text style={styles.resetError}>{resetError}</Text> : null}
					</>
				) : null}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: { backgroundColor: colors.background, flex: 1, overflow: 'hidden' },
	backgroundCurve: { backgroundColor: colors.lilac, position: 'absolute' },

	content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 14 },

	topRow: { alignItems: 'center', flexDirection: 'row', marginTop: 12 },
	backButton: { alignItems: 'center', height: 41, justifyContent: 'center', marginLeft: -8, width: 40 },
	backIcon: { height: 41, width: 40 },

	title: { color: colors.ink, fontSize: 30, fontWeight: '900', marginTop: 14 },
	loader: { marginTop: 48 },

	avatarWrap: { alignItems: 'center', marginTop: 24 },
	avatar: {
		alignItems: 'center',
		borderColor: '#FFFFFF',
		borderRadius: 48,
		borderWidth: 4,
		elevation: 3,
		height: 96,
		justifyContent: 'center',
		shadowColor: '#777',
		shadowOpacity: 0.22,
		shadowRadius: 4,
		width: 96,
	},
	avatarText: { color: '#FFF4E9', fontSize: 40, fontWeight: '800' },

	errorBox: { marginTop: 18 },
	errorText: { color: colors.danger, fontSize: 14, textAlign: 'center' },
	retry: { color: colors.menu, fontSize: 14, fontWeight: '800', marginTop: 6, textAlign: 'center' },

	list: { gap: 14, marginTop: 26 },
	infoItem: {
		backgroundColor: colors.menu,
		borderRadius: 10,
		elevation: 4,
		paddingHorizontal: 16,
		paddingVertical: 12,
		shadowColor: colors.menuShadow,
		shadowOffset: { height: 3, width: 0 },
		shadowOpacity: 0.35,
		shadowRadius: 3,
	},
	infoLabel: { color: colors.label, fontSize: 13, fontWeight: '700' },
	infoValue: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginTop: 2 },

	resetButton: {
		alignItems: 'center',
		backgroundColor: colors.danger,
		borderRadius: 10,
		elevation: 4,
		height: 52,
		justifyContent: 'center',
		marginTop: 'auto',
		shadowColor: '#6E0F36',
		shadowOffset: { height: 3, width: 0 },
		shadowOpacity: 0.35,
		shadowRadius: 3,
	},
	resetText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
	hint: { color: '#5A5A66', fontSize: 13, marginTop: 8, textAlign: 'center' },
	resetError: { color: colors.danger, fontSize: 14, marginTop: 10, textAlign: 'center' },

	disabled: { opacity: 0.5 },
	pressed: { opacity: 0.75 },
});