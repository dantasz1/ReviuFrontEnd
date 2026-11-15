import { Image } from 'expo-image';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import { type ComponentRef, useEffect, useRef, useState } from 'react';
import {
	Keyboard,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	useWindowDimensions,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { login as authenticate } from '../../../services/auth';

export default function LoginScreen() {
	const { height } = useWindowDimensions();
	
	const compact = height < 700;

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [passwordVisible, setPasswordVisible] = useState(false);
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const containerRef = useRef<ComponentRef<typeof View>>(null);
	const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
	const passwordInputRef = useRef<ComponentRef<typeof TextInput>>(null);
	const fieldsTop = useRef(0);
	const [keyboardOverlap, setKeyboardOverlap] = useState(0);

	
	const scrollToFields = () => {
		setTimeout(() => {
			scrollRef.current?.scrollTo({ animated: true, y: Math.max(0, fieldsTop.current - 16) });
		}, 120);
	};

	
	useEffect(() => {
		const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
		const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

		const showSub = Keyboard.addListener(showEvent, (event) => {
			const container = containerRef.current;
			if (!container) return;

			container.measureInWindow((_x: number, y: number, _width: number, containerHeight: number) => {
				setKeyboardOverlap(Math.max(0, y + containerHeight - event.endCoordinates.screenY));
				scrollToFields();
			});
		});
		const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardOverlap(0));

		return () => {
			showSub.remove();
			hideSub.remove();
		};
	}, []);

	const submitLogin = async () => {
		if (isLoading) return;

		if (!email.trim() || !password) {
			setError('Digite seu email e sua senha.');
			return;
		}

		Keyboard.dismiss();
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
				<View collapsable={false} ref={containerRef} style={styles.container}>
					<ScrollView
						contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 + keyboardOverlap }]}
						keyboardShouldPersistTaps="handled"
						ref={scrollRef}
						showsVerticalScrollIndicator={false}
					>
						<View style={styles.column}>
							<Pressable
								accessibilityLabel="Voltar"
								accessibilityRole="button"
								hitSlop={4}
								onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
								style={styles.backButton}
							>
								<Image
									source={require('@/assets/images/Left.svg')}
									contentFit="contain"
									style={styles.backIcon}
								/>
							</Pressable>

							<Text
								maxFontSizeMultiplier={1.2}
								style={[styles.title, compact && { fontSize: 26, lineHeight: 30, marginTop: 12 }]}
							>
								Seja bem vindo novamente, vamos voltar aos estudos?
							</Text>

							<LottieView
								autoPlay
								loop
								source={require('@/assets/lotties/Study.json')}
								style={[styles.studyAnimation, compact && { height: 150, marginTop: 8 }]}
							/>

							<View
								onLayout={(event) => {
									fieldsTop.current = event.nativeEvent.layout.y;
								}}
								style={[styles.fields, compact && { gap: 14, marginTop: 12 }]}
							>
								<View style={[styles.field, compact && { height: 52 }]}>
									<TextInput
										accessibilityLabel="Email"
										autoCapitalize="none"
										autoComplete="email"
										autoCorrect={false}
										keyboardType="email-address"
										maxFontSizeMultiplier={1.3}
										onChangeText={(value) => {
											setEmail(value);
											if (error) setError('');
										}}
										onFocus={scrollToFields}
										onSubmitEditing={() => passwordInputRef.current?.focus()}
										placeholder="Digite seu email"
										placeholderTextColor="rgba(0, 0, 0, 0.5)"
										returnKeyType="next"
										style={[styles.input, compact && { fontSize: 16 }]}
										textContentType="emailAddress"
										value={email}
									/>
									<Image
										source={require('@/assets/images/onboarding/email.png')}
										contentFit="contain"
										style={styles.fieldIcon}
									/>
								</View>

								<View style={[styles.field, compact && { height: 52 }]}>
									<TextInput
										accessibilityLabel="Senha"
										autoComplete="password"
										maxFontSizeMultiplier={1.3}
										onChangeText={(value) => {
											setPassword(value);
											if (error) setError('');
										}}
										onFocus={scrollToFields}
										onSubmitEditing={submitLogin}
										placeholder="Digite sua senha"
										placeholderTextColor="rgba(0, 0, 0, 0.5)"
										ref={passwordInputRef}
										returnKeyType="done"
										secureTextEntry={!passwordVisible}
										style={[styles.input, compact && { fontSize: 16 }]}
										textContentType="password"
										value={password}
									/>
									<Pressable
										accessibilityLabel={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}
										accessibilityRole="button"
										hitSlop={6}
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
								hitSlop={6}
								onPress={() => router.push('/forgot-password')}
								style={styles.forgotPasswordButton}
							>
								<Text maxFontSizeMultiplier={1.3} style={styles.forgotPasswordText}>
									Esqueci minha senha
								</Text>
							</Pressable>

							{error ? (
								<Text accessibilityLiveRegion="polite" maxFontSizeMultiplier={1.3} style={styles.error}>
									{error}
								</Text>
							) : null}

							{/* empurra o botão para o fim da tela quando sobra espaço */}
							<View style={styles.spacer} />

							<Pressable
								accessibilityRole="button"
								accessibilityState={{ busy: isLoading, disabled: isLoading }}
								disabled={isLoading}
								onPress={submitLogin}
								style={({ pressed }) => [
									styles.submitButton,
									compact && { height: 52 },
									(pressed || isLoading) && styles.submitButtonPressed,
								]}
							>
								<Text maxFontSizeMultiplier={1.3} style={styles.submitButtonText}>
									{isLoading ? 'Entrando...' : 'Fazer login'}
								</Text>
							</Pressable>
						</View>
					</ScrollView>
				</View>
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
	container: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
		paddingHorizontal: 20,
	},
	column: {
		alignSelf: 'center',
		flexGrow: 1,
		maxWidth: 480,
		width: '100%',
	},
	backButton: {
		alignItems: 'center',
		height: 44,
		justifyContent: 'center',
		marginLeft: -4,
		width: 44,
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
		paddingVertical: 10,
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
		height: 44,
		justifyContent: 'center',
		width: 44,
	},
	error: {
		color: '#A11B1B',
		fontFamily: 'Inter',
		fontSize: 14,
		marginTop: 8,
	},
	spacer: {
		flexGrow: 1,
		minHeight: 24,
	},
	submitButton: {
		alignItems: 'center',
		backgroundColor: '#8A3FFC',
		borderRadius: 10,
		height: 58,
		justifyContent: 'center',
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