import React from 'react';
import {TouchableOpacity} from 'react-native';
import {useTheme} from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Box, Text} from './core';
import type {Theme} from '../theme';

type ChipProps = {
  label: string;
  color?: keyof Theme['colors'];
  onPress?: () => void;
  onRemove?: () => void;
};

export function Chip({label, color, onPress, onRemove}: ChipProps) {
  const theme = useTheme<Theme>();
  const bgColor = color ? theme.colors[color] + '20' : theme.colors.chipBackground;
  const textColor = color ? theme.colors[color] : theme.colors.text;

  const content = (
    <Box
      flexDirection="row"
      alignItems="center"
      paddingHorizontal="m"
      paddingVertical="xs"
      borderRadius="xl"
      style={{backgroundColor: bgColor}}>
      <Text variant="caption" style={{color: textColor, fontWeight: '500'}}>
        {label}
      </Text>
      {onRemove && (
        <TouchableOpacity onPress={onRemove} style={{marginLeft: 4}}>
          <Ionicons name="close-circle" size={14} color={textColor} />
        </TouchableOpacity>
      )}
    </Box>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

type BadgeVariant = 'success' | 'warning' | 'neutral' | 'danger' | 'primary';

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
};

const badgeColors: Record<BadgeVariant, {bg: keyof Theme['colors']; text: keyof Theme['colors']}> = {
  success: {bg: 'success', text: 'white'},
  warning: {bg: 'warning', text: 'white'},
  neutral: {bg: 'neutral', text: 'white'},
  danger: {bg: 'danger', text: 'white'},
  primary: {bg: 'primary', text: 'white'},
};

export function Badge({label, variant = 'neutral'}: BadgeProps) {
  const {bg, text: textColorKey} = badgeColors[variant];

  return (
    <Box
      backgroundColor={bg}
      paddingHorizontal="s"
      paddingVertical="xs"
      borderRadius="xl"
      alignSelf="flex-start">
      <Text
        variant="caption"
        color={textColorKey}
        style={{fontSize: 11, fontWeight: '600'}}>
        {label}
      </Text>
    </Box>
  );
}
