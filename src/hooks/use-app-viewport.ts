import { Platform, useWindowDimensions } from 'react-native';

export const WEB_APP_MAX_WIDTH = 480;

export function useAppViewport() {
  const { height, width } = useWindowDimensions();

  return {
    height,
    width: Platform.OS === 'web' ? Math.min(width, WEB_APP_MAX_WIDTH) : width,
  };
}
