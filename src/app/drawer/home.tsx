import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Bem-vindo ao Reviu</Text>
			<Text style={styles.subtitle}>Sua jornada de estudos começa aqui.</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		backgroundColor: '#E9DFFF',
		flex: 1,
		justifyContent: 'center',
		padding: 24,
	},
	title: {
		color: '#171717',
		fontSize: 24,
		fontWeight: '700',
		textAlign: 'center',
	},
	subtitle: {
		color: '#171717',
		fontSize: 16,
		marginTop: 8,
		textAlign: 'center',
	},
});
