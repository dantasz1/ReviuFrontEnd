import { Image } from 'expo-image';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
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
import { login as authenticate } from '../../../services/auth';

export default function LoginScreen() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [passwordVisible, setPasswordVisible] = useState(false);
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const submitLogin = async () => {
		if (!email.trim() || !password) {
			setError('Digite seu email e sua senha.');
			return;
		}

		setError('');
		setIsLoading(true);

		try {
			await authenticate(email.trim(), password);
			router.replace('/drawer/home');
		} catch (error) {
			setError(error instanceof Error ? error.message : 'Não foi possível realizar o login.');
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
						contentContainerStyle={styles.scrollContent}
						keyboardShouldPersistTaps="handled"
						showsVerticalScrollIndicator={false}
					>
						<Pressable
							accessibilityLabel="Voltar"
							accessibilityRole="button"
							onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
							style={styles.backButton}
						>
							<Image
								source={require('@/assets/images/Left.svg')}
								contentFit="contain"
								style={styles.backIcon}
							/>
						</Pressable>

						<Text style={styles.title}>
							Seja bem vindo novamente, vamos voltar aos estudos?
						</Text>

						<LottieView
							autoPlay
							loop
							source={require('@/assets/lotties/Study.json')}
							style={styles.studyAnimation}
						/>

						<View style={styles.fields}>
							<View style={styles.field}>
								<TextInput
									accessibilityLabel="Email"
									autoCapitalize="none"
									keyboardType="email-address"
									onChangeText={setEmail}
									placeholder="Digite seu email"
									placeholderTextColor="rgba(0, 0, 0, 0.5)"
									returnKeyType="next"
									style={styles.input}
									textContentType="emailAddress"
									value={email}
								/>
								<Image
									source={require('@/assets/images/onboarding/email.png')}
									contentFit="contain"
									style={styles.fieldIcon}
								/>
							</View>

							<View style={styles.field}>
								<TextInput
									accessibilityLabel="Senha"
									onChangeText={setPassword}
									placeholder="Digite sua senha"
									placeholderTextColor="rgba(0, 0, 0, 0.5)"
									returnKeyType="done"
									secureTextEntry={!passwordVisible}
									style={styles.input}
									textContentType="password"
									value={password}
								/>
								<Pressable
									accessibilityLabel={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}
									accessibilityRole="button"
									onPress={() => setPasswordVisible((visible) => !visible)}
									style={styles.passwordButton}
								>
									<Image
										source={require('@/assets/images/onboarding/password.png')}
										contentFit="contain"
										style={styles.fieldIcon}
									/>
								</Pressable>
							</View>
						</View>

						<Pressable
							accessibilityRole="button"
							onPress={() => router.push('/forgot-password')}
							style={styles.forgotPasswordButton}
						>
							<Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
						</Pressable>

						{error ? <Text style={styles.error}>{error}</Text> : null}

						<Pressable
							accessibilityRole="button"
							disabled={isLoading}
							onPress={submitLogin}
							style={({ pressed }) => [
								styles.submitButton,
								(pressed || isLoading) && styles.submitButtonPressed,
							]}
						>
							<Text style={styles.submitButtonText}>
								{isLoading ? 'Entrando...' : 'Fazer login'}
							</Text>
						</Pressable>
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
	scrollContent: {
		flexGrow: 1,
		paddingHorizontal: 20,
		paddingBottom: 24,
	},
	backButton: {
		alignItems: 'center',
		height: 41,
		justifyContent: 'center',
		marginLeft: -4,
		width: 40,
	},
	backIcon: {
		height: 41,
		width: 40,
	},
	title: {
		color: '#202020',
		fontFamily: 'Inter',
		fontSize: 32,
		fontWeight: '700',
		lineHeight: 35,
		marginTop: 25,
	},
	studyAnimation: {
		alignSelf: 'center',
		height: 260,
		marginTop: 16,
		width: '100%',
	},
	fields: {
		gap: 22,
		marginTop: 23,
	},
	forgotPasswordButton: {
		alignSelf: 'flex-end',
		paddingVertical: 8,
	},
	forgotPasswordText: {
		color: '#8A3FFC',
		fontFamily: 'Inter',
		fontSize: 14,
		fontWeight: '500',
	},
	field: {
		alignItems: 'center',
		backgroundColor: 'rgba(188, 175, 207, 0.5)',
		borderRadius: 10,
		flexDirection: 'row',
		height: 58,
		paddingHorizontal: 19,
	},
	input: {
		color: '#171717',
		flex: 1,
		fontFamily: 'Inter',
		fontSize: 18,
		height: '100%',
	},
	fieldIcon: {
		height: 25,
		opacity: 0.5,
		width: 25,
	},
	passwordButton: {
		alignItems: 'center',
		height: 40,
		justifyContent: 'center',
		width: 40,
	},
	error: {
		color: '#A11B1B',
		fontFamily: 'Inter',
		fontSize: 14,
		marginTop: 8,
	},
	submitButton: {
		alignItems: 'center',
		backgroundColor: '#8A3FFC',
		borderRadius: 10,
		height: 58,
		justifyContent: 'center',
		marginTop: 49,
		width: '100%',
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
