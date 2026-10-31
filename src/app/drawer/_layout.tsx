import { View } from 'react-native';
import { Stack } from 'expo-router';

import { BottomNavigation } from '@/components/bottom-navigation';

export default function DrawerLayout() {
	return <View style={{ flex: 1 }}>
		<Stack screenOptions={{ headerShown: false }} />
		<BottomNavigation />
	</View>;
}
