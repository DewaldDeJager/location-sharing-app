import {createTheme} from '@shopify/restyle';

const palette = {
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray700: '#374151',
  gray900: '#111827',
  blue500: '#3B82F6',
  blue600: '#2563EB',
  green500: '#22C55E',
  green600: '#16A34A',
  amber500: '#F59E0B',
  amber600: '#D97706',
  red500: '#EF4444',
  red600: '#DC2626',
};

const theme = createTheme({
  colors: {
    background: palette.gray50,
    card: palette.white,
    text: palette.gray900,
    muted: palette.gray500,
    border: palette.gray200,
    primary: palette.blue500,
    primaryDark: palette.blue600,
    success: palette.green500,
    successDark: palette.green600,
    warning: palette.amber500,
    warningDark: palette.amber600,
    neutral: palette.gray400,
    danger: palette.red500,
    dangerDark: palette.red600,
    white: palette.white,
    black: palette.black,
    chipBackground: palette.gray100,
    inputBackground: palette.gray100,
    skeletonBase: palette.gray200,
    skeletonHighlight: palette.gray100,
    transparent: 'transparent',
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 12,
    l: 16,
    xl: 24,
    xxl: 32,
  },
  borderRadii: {
    s: 10,
    m: 14,
    l: 18,
    xl: 24,
  },
  textVariants: {
    defaults: {
      color: 'text',
      fontSize: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: '700' as const,
      color: 'text',
    },
    subtitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: 'text',
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      color: 'text',
    },
    caption: {
      fontSize: 13,
      fontWeight: '400' as const,
      color: 'muted',
    },
    button: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: 'white',
    },
  },
  buttonVariants: {
    defaults: {
      paddingVertical: 'm',
      paddingHorizontal: 'l',
      borderRadius: 'm',
    },
    primary: {
      backgroundColor: 'primary',
    },
    success: {
      backgroundColor: 'success',
    },
    warning: {
      backgroundColor: 'warning',
    },
    danger: {
      backgroundColor: 'danger',
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: 'border',
    },
    ghost: {
      backgroundColor: 'transparent',
    },
  },
});

export type Theme = typeof theme;
export default theme;
