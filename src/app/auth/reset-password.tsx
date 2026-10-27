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
import { resetPassword } from '../../../services/auth';

export default function ResetPasswordScreen() {
	const [code, setCode] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [passwordConfirmation, setPasswordConfirmation] = useState('');
	const [message, setMessage] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [didReset, setDidReset] = useState(false);

	const submitReset = async () => {
		const normalizedCode = code.trim();
		if (!normalizedCode || !newPassword || !passwordConfirmation) {
			setMessage('Preencha o código e os dois campos de senha.');
			return;
		}

		if (newPassword !== passwordConfirmation) {
			setMessage('As senhas não coincidem.');
			return;
		}

		setMessage('');
		setIsLoading(true);
		try {
			await resetPassword(normalizedCode, newPassword);
			setDidReset(true);
			setMessage('Senha redefinida com sucesso.');
		} catch (error) {
			setMessage(error instanceof Error ? error.message : 'Não foi possível redefinir a senha.');
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
							accessibilityLabel="Voltar"
							accessibilityRole="button"
							onPress={() => router.back()}
							style={styles.backButton}
						>
							<Text style={styles.backText}>Voltar</Text>
						</Pressable>

						<Text style={styles.title}>Redefinir senha</Text>
						<Text style={styles.description}>
							Digite o código recebido por e-mail e crie uma nova senha.
						</Text>

						{!didReset ? (
							<>
								<View style={styles.field}>
									<TextInput
										accessibilityLabel="Código de redefinição"
										autoCapitalize="none"
										onChangeText={setCode}
										placeholder="Código recebido por e-mail"
										placeholderTextColor="rgba(0, 0, 0, 0.5)"
										returnKeyType="next"
										style={styles.input}
										value={code}
									/>
								</View>

								<View style={styles.field}>
									<TextInput
										accessibilityLabel="Nova senha"
										autoCapitalize="none"
										onChangeText={setNewPassword}
										placeholder="Nova senha"
										placeholderTextColor="rgba(0, 0, 0, 0.5)"
										returnKeyType="next"
										secureTextEntry
										style={styles.input}
										value={newPassword}
									/>
								</View>

								<View style={styles.field}>
									<TextInput
										accessibilityLabel="Confirme a nova senha"
										autoCapitalize="none"
										onChangeText={setPasswordConfirmation}
										placeholder="Confirme a nova senha"
										placeholderTextColor="rgba(0, 0, 0, 0.5)"
										returnKeyType="done"
										secureTextEntry
										style={styles.input}
										value={passwordConfirmation}
									/>
								</View>
							</>
						) : null}

						{message ? <Text style={styles.message}>{message}</Text> : null}

						{didReset ? (
							<Pressable
								accessibilityRole="button"
								onPress={() => router.replace('/auth/login')}
								style={({ pressed }) => [
									styles.submitButton,
									pressed && styles.submitButtonPressed,
								]}
							>
								<Text style={styles.submitButtonText}>Ir para o login</Text>
							</Pressable>
						) : (
							<Pressable
								accessibilityRole="button"
								disabled={isLoading}
								onPress={submitReset}
								style={({ pressed }) => [
									styles.submitButton,
									(pressed || isLoading) && styles.submitButtonPressed,
								]}
							>
								<Text style={styles.submitButtonText}>
									{isLoading ? 'Salvando...' : 'Redefinir senha'}
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
		marginTop: 20,
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
