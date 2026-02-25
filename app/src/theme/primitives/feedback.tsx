import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet} from 'react-native';
import {useTheme} from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Box, Text} from './core';
import {Button} from './Button';
import type {Theme} from '../theme';

type EmptyStateProps = {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({icon, title, message, actionLabel, onAction}: EmptyStateProps) {
  const theme = useTheme<Theme>();

  return (
    <Box flex={1} alignItems="center" justifyContent="center" padding="xxl">
      {icon && (
        <Box marginBottom="l">
          <Ionicons name={icon} size={48} color={theme.colors.muted} />
        </Box>
      )}
      <Text variant="subtitle" style={{textAlign: 'center'}} marginBottom="s">
        {title}
      </Text>
      {message && (
        <Text variant="caption" style={{textAlign: 'center'}} marginBottom="l">
          {message}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} variant="primary" />
      )}
    </Box>
  );
}

type SkeletonRowProps = {
  lines?: number;
};

export function SkeletonRow({lines = 2}: SkeletonRowProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Box
      backgroundColor="card"
      borderRadius="m"
      padding="l"
      marginHorizontal="l"
      marginVertical="xs">
      <Box flexDirection="row" alignItems="center">
        <Animated.View
          style={[internalStyles.skeletonCircle, {opacity}]}
        />
        <Box flex={1} marginLeft="m">
          <Animated.View
            style={[internalStyles.skeletonLine, {opacity, width: '60%'}]}
          />
          {lines >= 2 && (
            <Animated.View
              style={[
                internalStyles.skeletonLine,
                {opacity, width: '40%', marginTop: 8},
              ]}
            />
          )}
          {lines >= 3 && (
            <Animated.View
              style={[
                internalStyles.skeletonLine,
                {opacity, width: '80%', marginTop: 8},
              ]}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}

const internalStyles = StyleSheet.create({
  skeletonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
});
