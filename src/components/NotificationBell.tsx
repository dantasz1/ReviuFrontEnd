import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getUnreadCount } from '../../services/inbox';

export function NotificationBell({
	variant = 'blue',
	interactive = true,
}: {
	variant?: 'blue' | 'white';
	interactive?: boolean;
}) {
	const [count, setCount] = useState(0);

	useFocusEffect(
		useCallback(() => {
			let active = true;

			getUnreadCount()
				.then((total) => {
					if (active) setCount(total);
				})
				.catch(() => {});

			return () => {
				active = false;
			};
		}, []),
	);

	const content = (
		<>
			<Image
				contentFit="contain"
				source={
					variant === 'white'
						? require('@/assets/images/home/NotificacaoBranca.svg')
						: require('@/assets/images/home/NotificacaoAzul.svg')
				}
				style={styles.icon}
			/>
			{count > 0 ? (
				<View style={styles.badge}>
					<Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
				</View>
			) : null}
		</>
	);

	if (!interactive) {
		return <View style={styles.button}>{content}</View>;
	}

	return (
		<Pressable
			accessibilityLabel={count > 0 ? `Notificações, ${count} novas` : 'Notificações'}
			accessibilityRole="button"
			hitSlop={12}
			onPress={() => router.push('/drawer/notifications')}
			style={styles.button}
		>
			{content}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	button: { height: 30, width: 30 },
	icon: { height: 26, width: 26 },
	badge: {
		alignItems: 'center',
		backgroundColor: '#FF3B78',
		borderColor: '#FFFFFF',
		borderRadius: 9,
		borderWidth: 1.5,
		height: 18,
		justifyContent: 'center',
		minWidth: 18,
		paddingHorizontal: 3,
		position: 'absolute',
		right: -2,
		top: -4,
	},
	badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
});
