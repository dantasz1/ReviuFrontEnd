import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const fields = [
	{ key: 'name', placeholder: 'Digite seu nome', icon: require('@/assets/images/onboarding/name.png'), secure: false },
	{ key: 'email', placeholder: 'Digite seu email', icon: require('@/assets/images/onboarding/email.png'), secure: false },
	{ key: 'password', placeholder: 'Digite sua senha', icon: require('@/assets/images/onboarding/password.png'), secure: true },
	{ key: 'passwordConfirmation', placeholder: 'Digite sua senha novamente', icon: require('@/assets/images/onboarding/password.png'), secure: true },
] as const;

export default function SignupScreen() {
	const [values, setValues] = useState<Record<string, string>>({});
	const [passwordVisible, setPasswordVisible] = useState(false);
	const [error, setError] = useState('');

	const createAccount = () => {
		const hasMissingField = fields.some((field) => !values[field.key]?.trim());

		if (hasMissingField) {
			setError('Preencha todos os campos para continuar.');
			return;
		}

		if (values.password !== values.passwordConfirmation) {
			setError('As senhas precisam ser iguais.');
			return;
		}

		setError('');
		router.push('/auth/verify');
	};

	return (
		<View style={styles.screen}>
			<Image
				source={require('@/assets/images/onboarding/background.png')}
				contentFit="fill"
				style={styles.background}
			/>
			<SafeAreaView style={styles.content} edges={['top', 'bottom']}>
				<Text style={styles.title}>A um passo de estudar de maneira eficaz e divertida.</Text>
				<View style={styles.fields}>
					{fields.map((field) => (
						<View key={field.key} style={styles.field}>
							<TextInput
								accessibilityLabel={field.placeholder}
								autoCapitalize={field.key === 'email' ? 'none' : 'sentences'}
								keyboardType={field.key === 'email' ? 'email-address' : 'default'}
								onChangeText={(value) => setValues((current) => ({ ...current, [field.key]: value }))}
								placeholder={field.placeholder}
								placeholderTextColor="rgba(0, 0, 0, 0.5)"
								secureTextEntry={field.secure && !passwordVisible}
								style={styles.input}
							/>
							<Pressable
								accessibilityLabel={field.secure ? 'Mostrar ou ocultar senha' : field.placeholder}
								accessibilityRole={field.secure ? 'button' : undefined}
								disabled={!field.secure}
								onPress={() => setPasswordVisible((visible) => !visible)}
								style={styles.iconButton}
							>
								<Image source={field.icon} contentFit="contain" style={styles.fieldIcon} />
							</Pressable>
						</View>
					))}
				</View>
				{error ? <Text style={styles.error}>{error}</Text> : null}
				<Pressable
					accessibilityRole="button"
					onPress={createAccount}
					style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
				>
					<Text style={styles.buttonText}>Criar conta</Text>
				</Pressable>
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
		marginTop: 65,
	},
	fields: {
		gap: 20,
		marginTop: 65,
	},
	field: {
		alignItems: 'center',
		backgroundColor: 'rgba(188, 175, 207, 0.5)',
		borderRadius: 10,
		flexDirection: 'row',
		height: 58,
		paddingLeft: 20,
		paddingRight: 16,
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
		height: 40,
		justifyContent: 'center',
		width: 40,
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
		marginTop: 8,
	},
	button: {
		alignItems: 'center',
		backgroundColor: '#8A3FFC',
		borderRadius: 10,
		height: 58,
		justifyContent: 'center',
		marginBottom: 47,
		marginTop: 'auto',
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
