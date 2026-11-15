import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { router } from 'expo-router';
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

import { getOnboardingAnswersForApi } from '@/data/onboarding';
import { register } from '../../../services/auth';

const PENDING_EMAIL_KEY = '@reviu/pending-email';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_.]{3,20}$/;

const fields = [
	{ key: 'name', placeholder: 'Digite seu nome', icon: require('@/assets/images/onboarding/name.png'), secure: false },
	{ key: 'username', placeholder: 'Escolha um nome de usuário', icon: require('@/assets/images/onboarding/name.png'), secure: false },
	{ key: 'email', placeholder: 'Digite seu email', icon: require('@/assets/images/onboarding/email.png'), secure: false },
	{ key: 'password', placeholder: 'Digite sua senha', icon: require('@/assets/images/onboarding/password.png'), secure: true },
	{ key: 'passwordConfirmation', placeholder: 'Digite sua senha novamente', icon: require('@/assets/images/onboarding/password.png'), secure: true },
] as const;

export default function SignupScreen() {
	const { height } = useWindowDimensions();
	
	const compact = height < 700;

	const [values, setValues] = useState<Record<string, string>>({});
	const [passwordVisible, setPasswordVisible] = useState(false);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const containerRef = useRef<ComponentRef<typeof View>>(null);
	const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
	const inputRefs = useRef<Record<string, ComponentRef<typeof TextInput> | null>>({});
	const fieldsTop = useRef(0);
	const fieldY = useRef<Record<string, number>>({});
	const focusedKey = useRef<string | null>(null);
	const [keyboardOverlap, setKeyboardOverlap] = useState(0);

	
	const scrollToField = (key: string) => {
		const y = fieldsTop.current + (fieldY.current[key] ?? 0);
		setTimeout(() => scrollRef.current?.scrollTo({ animated: true, y: Math.max(0, y - 24) }), 120);
	};

	
	useEffect(() => {
		const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
		const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

		const showSub = Keyboard.addListener(showEvent, (event) => {
			const container = containerRef.current;
			if (!container) return;

			container.measureInWindow((_x: number, y: number, _width: number, containerHeight: number) => {
				setKeyboardOverlap(Math.max(0, y + containerHeight - event.endCoordinates.screenY));
				if (focusedKey.current) scrollToField(focusedKey.current);
			});
		});
		const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardOverlap(0));

		return () => {
			showSub.remove();
			hideSub.remove();
		};
	}, []);

	const createAccount = async () => {
		if (loading) return;

		const hasMissingField = fields.some((field) => !values[field.key]?.trim());

		if (hasMissingField) {
			setError('Preencha todos os campos para continuar.');
			return;
		}

		const name = values.name.trim();
		const username = values.username.trim();
		const email = values.email.trim();

		if (!USERNAME_REGEX.test(username)) {
			setError('O usuário deve ter de 3 a 20 caracteres: letras, números, _ ou .');
			return;
		}

		if (!EMAIL_REGEX.test(email)) {
			setError('Digite um e-mail válido.');
			return;
		}

		if (values.password !== values.passwordConfirmation) {
			setError('As senhas precisam ser iguais.');
			return;
		}

		Keyboard.dismiss();
		setError('');
		setLoading(true);

		try {
			// Respostas reais do onboarding; se alguma faltar, usa o valor padrão
			const answers = await getOnboardingAnswersForApi();
			if (!Object.values(answers).every(Boolean)) {
				setError('Finalize o questionário de onboarding antes de criar a conta.');
				return;
			}

			// Cria a conta; o backend envia o código de verificação para o e-mail
			await register({
				name,
				username,
				email,
				password: values.password,
				focoEstudos: answers.focoEstudos ?? 'Vestibular / ENEM',
				prazoFinal: answers.prazoFinal ?? 'Próximos 3 meses',
				metaDiaria: answers.metaDiaria ?? '10 minutos',
				horarioFoco: answers.horarioFoco ?? 'Manhã',
				retencaoConteudo: answers.retencaoConteudo ?? 'Esqueço fácil',
				ritmoRevisao: answers.ritmoRevisao ?? 'Leve',
			});

			// Guarda o e-mail para a tela de verificação não perdê-lo
			await AsyncStorage.setItem(PENDING_EMAIL_KEY, email);

			router.push({ pathname: '/auth/verify', params: { email } });
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Não foi possível criar a conta.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.screen}>
			<Image
				source={require('@/assets/images/onboarding/background.png')}
				contentFit="fill"
				style={styles.background}
			/>
			<SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
				<View collapsable={false} ref={containerRef} style={styles.container}>
					<ScrollView
						contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 + keyboardOverlap }]}
						keyboardShouldPersistTaps="handled"
						ref={scrollRef}
						showsVerticalScrollIndicator={false}
					>
						<View style={styles.column}>
							<Text
								maxFontSizeMultiplier={1.2}
								style={[
									styles.title,
									compact && { fontSize: 26, lineHeight: 30, marginTop: 16 },
								]}
							>
								A um passo de estudar de maneira eficaz e divertida.
							</Text>

							<View
								onLayout={(event) => {
									fieldsTop.current = event.nativeEvent.layout.y;
								}}
								style={[styles.fields, compact && { gap: 10, marginTop: 20 }]}
							>
								{fields.map((field, index) => {
									const isLast = index === fields.length - 1;

									return (
										<View
											key={field.key}
											onLayout={(event) => {
												fieldY.current[field.key] = event.nativeEvent.layout.y;
											}}
											style={[styles.field, compact && { height: 52 }]}
										>
											<TextInput
												accessibilityLabel={field.placeholder}
												autoCapitalize={field.key === 'name' ? 'words' : 'none'}
												autoComplete={
													field.key === 'name'
														? 'name'
														: field.key === 'username'
															? 'username-new'
															: field.key === 'email'
																? 'email'
																: 'new-password'
												}
												autoCorrect={false}
												editable={!loading}
												keyboardType={field.key === 'email' ? 'email-address' : 'default'}
												maxFontSizeMultiplier={1.3}
												onChangeText={(value) => {
													setValues((current) => ({ ...current, [field.key]: value }));
													if (error) setError('');
												}}
												onFocus={() => {
													focusedKey.current = field.key;
													scrollToField(field.key);
												}}
												onSubmitEditing={() => {
													if (isLast) {
														void createAccount();
													} else {
														inputRefs.current[fields[index + 1].key]?.focus();
													}
												}}
												placeholder={field.placeholder}
												placeholderTextColor="rgba(0, 0, 0, 0.5)"
												ref={(node) => {
													inputRefs.current[field.key] = node;
												}}
												returnKeyType={isLast ? 'done' : 'next'}
												secureTextEntry={field.secure && !passwordVisible}
												style={[styles.input, compact && { fontSize: 16 }]}
											/>
											<Pressable
												accessibilityLabel={field.secure ? 'Mostrar ou ocultar senha' : field.placeholder}
												accessibilityRole={field.secure ? 'button' : undefined}
												disabled={!field.secure}
												hitSlop={6}
												onPress={() => setPasswordVisible((visible) => !visible)}
												style={styles.iconButton}
											>
												<Image source={field.icon} contentFit="contain" style={styles.fieldIcon} />
											</Pressable>
										</View>
									);
								})}
							</View>

							{error ? (
								<Text accessibilityLiveRegion="polite" maxFontSizeMultiplier={1.3} style={styles.error}>
									{error}
								</Text>
							) : null}

							{/* empurra o botão para baixo quando sobra espaço, e some quando falta */}
							<View style={styles.spacer} />

							<Pressable
								accessibilityRole="button"
								accessibilityState={{ busy: loading, disabled: loading }}
								disabled={loading}
								onPress={createAccount}
								style={({ pressed }) => [
									styles.button,
									compact && { height: 52, marginBottom: 16 },
									(pressed || loading) && styles.buttonPressed,
								]}
							>
								<Text maxFontSizeMultiplier={1.3} style={styles.buttonText}>
									{loading ? 'Criando conta...' : 'Criar conta'}
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
		backgroundColor: '#F2E8FC',
		flex: 1,
		overflow: 'hidden',
	},
	background: {
		height: 1279,
		left: '50%',
		marginLeft: -440.5,
		position: 'absolute',
		top: -124,
		width: 881,
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
	title: {
		color: 'rgba(0, 0, 0, 0.88)',
		fontFamily: 'Inter',
		fontSize: 32,
		fontWeight: '700',
		lineHeight: 35,
		marginTop: 40,
	},
	fields: {
		gap: 14,
		marginTop: 36,
	},
	field: {
		alignItems: 'center',
		backgroundColor: 'rgba(188, 175, 207, 0.5)',
		borderRadius: 10,
		flexDirection: 'row',
		height: 58,
		paddingLeft: 20,
		paddingRight: 12,
	},
	input: {
		color: '#171717',
		flex: 1,
		fontFamily: 'Inter',
		fontSize: 18,
		height: '100%',
	},
	iconButton: {
		alignItems: 'center',
		height: 44,
		justifyContent: 'center',
		width: 44,
	},
	fieldIcon: {
		height: 25,
		opacity: 0.5,
		width: 25,
	},
	error: {
		color: '#A11B1B',
		fontFamily: 'Inter',
		fontSize: 14,
		marginTop: 10,
	},
	spacer: {
		flexGrow: 1,
		minHeight: 24,
	},
	button: {
		alignItems: 'center',
		backgroundColor: '#8A3FFC',
		borderRadius: 10,
		height: 58,
		justifyContent: 'center',
		marginBottom: 32,
		width: '100%',
	},
	buttonPressed: {
		opacity: 0.82,
	},
	buttonText: {
		color: '#FFFFFF',
		fontFamily: 'Inter',
		fontSize: 18,
		fontWeight: '500',
	},
});
