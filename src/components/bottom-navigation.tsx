import { Image } from 'expo-image';
import { router, usePathname, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type NavigationItem = {
	label: string;
	path?: Href;
	icon: number;
};

const items: NavigationItem[] = [
	{ label: 'Home', path: '/drawer/home', icon: require('@/assets/images/home/House.svg') },
	{ label: 'Decks', path: '/drawer/decks', icon: require('@/assets/images/home/Cartas.svg') },
	{ label: 'Amigos', path: '/drawer/friends', icon: require('@/assets/images/home/Friends.svg') },
	{ label: 'Config.', path: '/drawer/settings', icon: require('@/assets/images/home/Config.svg') },
];

export function BottomNavigation() {
	const pathname = usePathname();
	const insets = useSafeAreaInsets();
	const isDecksScreen = pathname === '/drawer/decks';

	return <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
		{items.map((item) => {
			const active = item.path ? pathname === item.path : false;
			return <Pressable
				accessibilityLabel={item.label}
				accessibilityRole="button"
				key={item.label}
				onPress={() => item.path && router.replace(item.path)}
				style={({ pressed }) => [styles.item, pressed && styles.pressed]}
			>
				<Image accessibilityLabel={item.label} contentFit="contain" source={item.icon} style={[styles.icon, isDecksScreen ? (active ? styles.deckActiveIcon : styles.deckScreenIcon) : active && styles.activeIcon]} />
			</Pressable>;
		})}
	</View>;
}

const styles = StyleSheet.create({
	container: { alignItems: 'center', bottom: 0, flexDirection: 'row', justifyContent: 'space-around', left: 0, paddingBottom: 4, paddingTop: 9, position: 'absolute', right: 0 },
	item: { alignItems: 'center', minWidth: 64, paddingHorizontal: 8 }, pressed: { opacity: 0.65 }, icon: { height: 30, tintColor: '#515151', width: 30 }, deckScreenIcon: { tintColor: '#FFFFFF' }, deckActiveIcon: { tintColor: '#FDCA40' }, activeIcon: { tintColor: '#3975F6' },
});
