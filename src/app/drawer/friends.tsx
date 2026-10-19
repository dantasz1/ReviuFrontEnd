import { StyleSheet, Text, View } from 'react-native';

export default function FriendsScreen() {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Amigos</Text>
			<Text style={styles.subtitle}>Seus amigos aparecerão aqui.</Text>
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
