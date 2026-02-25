import React from 'react';
import {TouchableOpacity} from 'react-native';
import {
  createRestyleComponent,
  createVariant,
  useTheme,
  BoxProps,
} from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Box, Text} from './core';
import type {Theme} from '../theme';

type ButtonVariant = 'primary' | 'success' | 'warning' | 'danger' | 'outline' | 'ghost';

const ButtonBase = createRestyleComponent<
  BoxProps<Theme> & {variant?: ButtonVariant; children: React.ReactNode},
  Theme
>([createVariant({themeKey: 'buttonVariants'})], Box);

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  icon?: string;
  loading?: boolean;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  icon,
}: ButtonProps) {
  const theme = useTheme<Theme>();
  const isOutlineOrGhost = variant === 'outline' || variant === 'ghost';
  const textColor = isOutlineOrGhost ? theme.colors.text : theme.colors.white;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={disabled ? {opacity: 0.5} : undefined}>
      <ButtonBase variant={variant}>
        <Box flexDirection="row" alignItems="center" justifyContent="center">
          {icon && (
            <Box marginRight="s">
              <Ionicons name={icon} size={18} color={textColor} />
            </Box>
          )}
          <Text variant="button" style={{color: textColor}}>
            {label}
          </Text>
        </Box>
      </ButtonBase>
    </TouchableOpacity>
  );
}
