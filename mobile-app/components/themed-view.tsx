import { View, type ViewProps } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Theme } from '@/constants/theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  // Use tactical surface color for dark mode background
  const backgroundColor = useThemeColor(
    { 
      light: lightColor || '#FFFFFF', 
      dark: darkColor || Theme.colors.surface 
    }, 
    'background'
  );

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
