import React from 'react';
import {TextInput, TouchableOpacity, StyleSheet} from 'react-native';
import {useTheme} from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Box} from './core';
import type {Theme} from '../theme';

type SearchInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export function SearchInput({
  value,
  onChangeText,
  placeholder = 'Search...',
}: SearchInputProps) {
  const theme = useTheme<Theme>();

  return (
    <Box
      backgroundColor="inputBackground"
      borderRadius="s"
      flexDirection="row"
      alignItems="center"
      paddingHorizontal="m"
      marginHorizontal="l"
      marginVertical="s">
      <Ionicons name="search-outline" size={18} color={theme.colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.muted}
        style={[
          internalStyles.searchInput,
          {color: theme.colors.text},
        ]}
        autoCorrect={false}
        autoCapitalize="none"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <Ionicons name="close-circle" size={18} color={theme.colors.muted} />
        </TouchableOpacity>
      )}
    </Box>
  );
}

const internalStyles = StyleSheet.create({
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
});
