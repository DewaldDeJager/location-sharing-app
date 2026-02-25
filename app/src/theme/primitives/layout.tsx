import React from 'react';
import {StyleSheet} from 'react-native';
import {BoxProps} from '@shopify/restyle';
import {Box} from './core';
import type {Theme} from '../theme';

type ScreenProps = BoxProps<Theme> & {children: React.ReactNode};

export function Screen({children, ...props}: ScreenProps) {
  return (
    <Box flex={1} backgroundColor="background" {...props}>
      {children}
    </Box>
  );
}

type CardProps = BoxProps<Theme> & {children: React.ReactNode};

export function Card({children, ...props}: CardProps) {
  return (
    <Box
      backgroundColor="card"
      borderRadius="m"
      padding="l"
      marginHorizontal="l"
      marginVertical="xs"
      shadowColor="black"
      shadowOffset={{width: 0, height: 1}}
      shadowOpacity={0.08}
      shadowRadius={2}
      elevation={2}
      {...props}>
      {children}
    </Box>
  );
}

type DividerProps = BoxProps<Theme>;

export function Divider(props: DividerProps) {
  return (
    <Box
      height={StyleSheet.hairlineWidth}
      backgroundColor="border"
      marginVertical="s"
      {...props}
    />
  );
}
