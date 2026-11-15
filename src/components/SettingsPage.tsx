import { router } from 'expo-router';
import { type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export const settingsColors = {
	ink: '#151515',
	muted: '#6F6A79',
	blue: '#3975F6',
	background: '#F7F3FF',
};

export function SettingsPage({ title, children }: { title: string; children: ReactNode }) {
	const insets = useSafeAreaInsets();

	return (
		<View style={styles.screen}>
			<SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
				<ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]} showsVerticalScrollIndicator={false}>
					<Pressable
						accessibilityLabel="Voltar"
						accessibilityRole="button"
						onPress={() => (router.canGoBack() ? router.back() : router.replace('/drawer/home'))}
						style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
					>
						<Text style={styles.backText}>‹</Text>
					</Pressable>
					<Text style={styles.title}>{title}</Text>
					{children}
				</ScrollView>
			</SafeAreaView>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: { backgroundColor: settingsColors.background, flex: 1 },
	safeArea: { flex: 1 },
	content: { paddingHorizontal: 20, paddingTop: 8 },
	backButton: { height: 42, justifyContent: 'center', width: 42 },
	backText: { color: settingsColors.ink, fontSize: 38, fontWeight: '300', lineHeight: 40 },
	title: { color: settingsColors.ink, fontSize: 30, fontWeight: '900', marginBottom: 24, marginTop: 8 },
	pressed: { opacity: 0.7 },
});
