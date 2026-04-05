import { StyleSheet, Text, type TextProps } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Theme } from '@/constants/theme';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'headline' | 'label' | 'body' | 'bodyBold';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        styles.base,
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        type === 'headline' ? styles.headline : undefined,
        type === 'label' ? styles.label : undefined,
        type === 'body' ? styles.body : undefined,
        type === 'bodyBold' ? styles.bodyBold : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: Theme.fonts.body,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Theme.fonts.bodyBold,
  },
  title: {
    fontSize: 32,
    fontFamily: Theme.fonts.headline,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontFamily: Theme.fonts.headline,
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: Theme.colors.primary,
  },
  headline: {
    fontSize: 24,
    fontFamily: Theme.fonts.headline,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 12,
    fontFamily: Theme.fonts.label,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  body: {
    fontSize: 14,
    fontFamily: Theme.fonts.body,
    lineHeight: 20,
  },
  bodyBold: {
    fontSize: 14,
    fontFamily: Theme.fonts.bodyBold,
    lineHeight: 20,
  }
});
