import React, {useState, useMemo} from 'react';
import {FlatList, TouchableOpacity} from 'react-native';
import {Box, Text, SearchInput, Button, Divider} from '../../theme';
import {Avatar} from './Avatar';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTheme} from '@shopify/restyle';
import type {Theme} from '../../theme';
import type {Person} from '../../types/social';

type MemberPickerProps = {
  /** All available people to pick from */
  people: Person[];
  /** Currently selected member IDs */
  selectedIds: string[];
  /** Called with updated selection */
  onSelectionChange: (ids: string[]) => void;
  /** Called when done picking */
  onDone: () => void;
  title?: string;
};

export function MemberPicker({
  people,
  selectedIds,
  onSelectionChange,
  onDone,
  title = 'Add Members',
}: MemberPickerProps) {
  const theme = useTheme<Theme>();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) {
      return people;
    }
    const q = search.toLowerCase();
    return people.filter(
      p =>
        p.displayName.toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q),
    );
  }, [people, search]);

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(sid => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <Box flex={1} backgroundColor="background">
      <Box paddingVertical="m">
        <Text variant="subtitle" marginHorizontal="l" marginBottom="s">
          {title}
        </Text>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search people..."
        />
      </Box>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        ItemSeparatorComponent={() => <Divider marginHorizontal="l" />}
        renderItem={({item}) => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <TouchableOpacity onPress={() => toggle(item.id)} activeOpacity={0.6}>
              <Box
                flexDirection="row"
                alignItems="center"
                paddingVertical="m"
                paddingHorizontal="l">
                <Avatar name={item.displayName} size={36} />
                <Box flex={1} marginLeft="m">
                  <Text variant="body" style={{fontSize: 15}}>
                    {item.displayName}
                  </Text>
                  <Text variant="caption">@{item.username}</Text>
                </Box>
                <Ionicons
                  name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={
                    isSelected ? theme.colors.primary : theme.colors.neutral
                  }
                />
              </Box>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Box padding="xxl" alignItems="center">
            <Text variant="caption">No people found</Text>
          </Box>
        }
      />

      <Box padding="l" backgroundColor="card">
        <Button
          label={`Done (${selectedIds.length} selected)`}
          onPress={onDone}
          variant="primary"
        />
      </Box>
    </Box>
  );
}
