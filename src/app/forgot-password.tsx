import { router } from 'expo-router';
import { useState } from 'react';
import {
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { requestPasswordReset } from '../../services/auth';

export default function ForgotPasswordScreen() {
	const [email, setEmail] = useState('');
	const [message, setMessage] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [resetRequested, setResetRequested] = useState(false);

	const submitRequest = async () => {
		const normalizedEmail = email.trim();
		if (!normalizedEmail) {
			setMessage('Digite seu e-mail.');
			return;
		}

		setMessage('');
		setResetRequested(false);
		setIsLoading(true);
		try {
			await requestPasswordReset(normalizedEmail);
			setMessage('Se esse e-mail estiver cadastrado, enviaremos um código para redefinir sua senha.');
			setResetRequested(true);
		} catch (error) {
			setMessage(error instanceof Error ? error.message : 'Não foi possível solicitar a redefinição.');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<View style={styles.screen}>
			<SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
				<KeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
					style={styles.keyboardAvoidingView}
				>
					<ScrollView
						contentContainerStyle={styles.content}
						keyboardShouldPersistTaps="handled"
						showsVerticalScrollIndicator={false}
					>
						<Pressable
							accessibilityLabel="Voltar ao login"
							accessibilityRole="button"
							onPress={() => router.back()}
							style={styles.backButton}
						>
							<Text style={styles.backText}>Voltar</Text>
						</Pressable>

						<Text style={styles.title}>Recuperar senha</Text>
						<Text style={styles.description}>
							Informe o e-mail da sua conta para receber um código de redefinição.
						</Text>

						<View style={styles.field}>
							<TextInput
								accessibilityLabel="E-mail"
								autoCapitalize="none"
								autoComplete="email"
								keyboardType="email-address"
								onChangeText={setEmail}
								placeholder="Digite seu e-mail"
								placeholderTextColor="rgba(0, 0, 0, 0.5)"
								returnKeyType="send"
								style={styles.input}
								value={email}
							/>
						</View>

						{message ? <Text style={styles.message}>{message}</Text> : null}

						{resetRequested ? (
							<Pressable
								accessibilityRole="button"
								onPress={() => router.push('/auth/reset-password')}
								style={({ pressed }) => [
									styles.submitButton,
									pressed && styles.submitButtonPressed,
								]}
							>
								<Text style={styles.submitButtonText}>Informar código</Text>
							</Pressable>
						) : (
							<Pressable
								accessibilityRole="button"
								disabled={isLoading}
								onPress={submitRequest}
								style={({ pressed }) => [
									styles.submitButton,
									(pressed || isLoading) && styles.submitButtonPressed,
								]}
							>
								<Text style={styles.submitButtonText}>
									{isLoading ? 'Enviando...' : 'Enviar código'}
								</Text>
							</Pressable>
						)}
					</ScrollView>
				</KeyboardAvoidingView>
			</SafeAreaView>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {
		backgroundColor: '#F1E8FC',
		flex: 1,
	},
	safeArea: {
		flex: 1,
	},
	keyboardAvoidingView: {
		flex: 1,
	},
	content: {
		flexGrow: 1,
		paddingHorizontal: 20,
		paddingBottom: 24,
	},
	backButton: {
		alignSelf: 'flex-start',
		paddingVertical: 12,
	},
	backText: {
		color: '#8A3FFC',
		fontFamily: 'Inter',
		fontSize: 16,
	},
	title: {
		color: '#202020',
		fontFamily: 'Inter',
		fontSize: 32,
		fontWeight: '700',
		lineHeight: 38,
		marginTop: 36,
	},
	description: {
		color: '#202020',
		fontFamily: 'Inter',
		fontSize: 16,
		lineHeight: 24,
		marginTop: 12,
	},
	field: {
		backgroundColor: 'rgba(188, 175, 207, 0.5)',
		borderRadius: 10,
		height: 58,
		marginTop: 32,
		paddingHorizontal: 19,
	},
	input: {
		color: '#171717',
		fontFamily: 'Inter',
		fontSize: 18,
		height: '100%',
	},
	message: {
		color: '#8A3FFC',
		fontFamily: 'Inter',
		fontSize: 14,
		lineHeight: 20,
		marginTop: 12,
	},
	submitButton: {
		alignItems: 'center',
		backgroundColor: '#8A3FFC',
		borderRadius: 10,
		height: 58,
		justifyContent: 'center',
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
