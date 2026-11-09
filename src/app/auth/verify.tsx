import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { resendVerification, verifyEmail } from '../../../services/auth';

const PENDING_EMAIL_KEY = '@reviu/pending-email';
const RESEND_SECONDS = 30;

export default function VerifyScreen() {
	const params = useLocalSearchParams<{ email?: string }>();
	const [email, setEmail] = useState(params.email ?? '');
	const [code, setCode] = useState('');
	const [message, setMessage] = useState('');
	const [verifying, setVerifying] = useState(false);
	const [sending, setSending] = useState(false);
	const [cooldown, setCooldown] = useState(0);

	
	useEffect(() => {
		if (email) return;
		AsyncStorage.getItem(PENDING_EMAIL_KEY).then((saved) => {
			if (saved) setEmail(saved);
		});
	}, [email]);

	useEffect(() => {
		if (cooldown <= 0) return;
		const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
		return () => clearTimeout(timer);
	}, [cooldown]);

	const updateCode = (value: string) => {
		setCode(value.replace(/\D/g, '').slice(0, 6));
		setMessage('');
	};

	const submitCode = async () => {
		if (verifying) return;

		if (code.length !== 6) {
			setMessage('Digite os 6 dígitos do código.');
			return;
		}
		if (!email) {
			setMessage('Não encontramos o e-mail. Volte e preencha o cadastro novamente.');
			return;
		}

		setVerifying(true);
		try {
			await verifyEmail(email, code);
			await AsyncStorage.removeItem(PENDING_EMAIL_KEY);
			router.replace('/auth/login');
		} catch (e) {
			setMessage(e instanceof Error ? e.message : 'Código inválido.');
		} finally {
			setVerifying(false);
		}
	};

	const resendCode = async () => {
		if (!email) {
			setMessage('Não encontramos o e-mail. Volte e preencha o cadastro novamente.');
			return;
		}

		setSending(true);
		try {
			await resendVerification(email);
			setMessage('Enviamos um novo código para o seu e-mail.');
			setCooldown(RESEND_SECONDS);
		} catch (e) {
			setMessage(e instanceof Error ? e.message : 'Não foi possível reenviar o código.');
		} finally {
			setSending(false);
		}
	};

	const resendDisabled = sending || cooldown > 0;

	return (
		<View style={styles.screen}>
			<SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
				<View style={styles.content}>
					<Text style={styles.title}>
						Digite o código de verificação que enviamos para o seu e-mail.
					</Text>

					<View style={styles.codeRow}>
						<View style={styles.digits} pointerEvents="none">
							{Array.from({ length: 6 }, (_, index) => (
								<View key={index} style={styles.digitBox}>
									<Text style={styles.digit}>{code[index] ?? ''}</Text>
								</View>
							))}
						</View>
						<TextInput
							accessibilityLabel="Código de verificação"
							autoComplete={Platform.OS === 'ios' ? 'one-time-code' : undefined}
							caretHidden
							keyboardType="number-pad"
							maxLength={6}
							onChangeText={updateCode}
							selectionColor="transparent"
							style={styles.codeInput}
							value={code}
						/>
					</View>

					{message ? <Text style={styles.message}>{message}</Text> : null}

					<Pressable
						accessibilityRole="button"
						disabled={resendDisabled}
						onPress={resendCode}
						style={styles.resendButton}
					>
						<Text style={[styles.resendText, resendDisabled && { opacity: 0.5 }]}>
							{cooldown > 0 ? `Reenviar código em ${cooldown}s` : 'Reenviar código'}
						</Text>
					</Pressable>

					<Pressable
						accessibilityRole="button"
						disabled={verifying}
						onPress={submitCode}
						style={({ pressed }) => [
							styles.submitButton,
							(pressed || verifying) && styles.submitButtonPressed,
						]}
					>
						<Text style={styles.submitButtonText}>{verifying ? 'Verificando...' : 'Enviar'}</Text>
					</Pressable>
				</View>
			</SafeAreaView>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {
		backgroundColor: '#F2E8FC',
		flex: 1,
	},
	safeArea: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 20,
	},
	title: {
		color: 'rgba(0, 0, 0, 0.88)',
		fontFamily: 'Inter',
		fontSize: 32,
		fontWeight: '700',
		lineHeight: 35,
		marginTop: 55,
		minHeight: 118,
	},
	codeRow: {
		marginTop: 70,
		position: 'relative',
	},
	digits: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	digitBox: {
		alignItems: 'center',
		backgroundColor: '#D6CCE7',
		borderRadius: 10,
		height: 58,
		justifyContent: 'center',
		width: 45,
	},
	digit: {
		color: '#171717',
		fontFamily: 'Inter',
		fontSize: 24,
		fontWeight: '500',
		textAlign: 'center',
	},
	codeInput: {
		...StyleSheet.absoluteFill,
		backgroundColor: 'transparent',
		color: 'transparent',
		fontSize: 1,
		includeFontPadding: false,
		padding: 0,
		textAlign: 'center',
	},
	message: {
		color: '#8A3FFC',
		fontFamily: 'Inter',
		fontSize: 14,
		marginTop: 12,
	},
	resendButton: {
		alignSelf: 'flex-start',
		marginTop: 16,
	},
	resendText: {
		color: '#8A3FFC',
		fontFamily: 'Inter',
		fontSize: 15,
		fontWeight: '700',
	},
	submitButton: {
		alignItems: 'center',
		backgroundColor: '#8A3FFC',
		borderRadius: 10,
		height: 58,
		justifyContent: 'center',
		marginBottom: 47,
		marginTop: 'auto',
	},
	submitButtonPressed: {
		opacity: 0.82,
	},
	submitButtonText: {
		color: '#FFFFFF',
		fontFamily: 'Inter',
		fontSize: 18,
		fontWeight: '500',
	},
});