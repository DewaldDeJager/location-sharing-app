import React from 'react';
import {Box, Text} from '../../theme';
import type {Theme} from '../../theme';

type AvatarProps = {
  name: string;
  size?: number;
  color?: keyof Theme['colors'];
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (parts[0]?.[0] ?? '?').toUpperCase();
}

const colorPool: Array<keyof Theme['colors']> = [
  'primary',
  'success',
  'warning',
  'danger',
];

function colorFromName(name: string): keyof Theme['colors'] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colorPool[Math.abs(hash) % colorPool.length];
}

export function Avatar({name, size = 40, color}: AvatarProps) {
  const bg = color ?? colorFromName(name);
  const fontSize = size * 0.4;

  return (
    <Box
      backgroundColor={bg}
      width={size}
      height={size}
      borderRadius="xl"
      alignItems="center"
      justifyContent="center"
      style={{borderRadius: size / 2}}>
      <Text
        variant="button"
        style={{fontSize, lineHeight: fontSize * 1.2}}
        color="white">
        {getInitials(name)}
      </Text>
    </Box>
  );
}

type StackedAvatarsProps = {
  names: string[];
  max?: number;
  size?: number;
};

export function StackedAvatars({names, max = 3, size = 32}: StackedAvatarsProps) {
  const visible = names.slice(0, max);
  const overflow = names.length - max;

  return (
    <Box flexDirection="row" alignItems="center">
      {visible.map((name, i) => (
        <Box
          key={name + i}
          style={{marginLeft: i > 0 ? -size * 0.3 : 0}}
          borderRadius="xl">
          <Avatar name={name} size={size} />
        </Box>
      ))}
      {overflow > 0 && (
        <Box
          backgroundColor="neutral"
          width={size}
          height={size}
          borderRadius="xl"
          alignItems="center"
          justifyContent="center"
          style={{marginLeft: -size * 0.3, borderRadius: size / 2}}>
          <Text variant="caption" color="white" style={{fontSize: size * 0.35, fontWeight: '600'}}>
            +{overflow}
          </Text>
        </Box>
      )}
    </Box>
  );
}
