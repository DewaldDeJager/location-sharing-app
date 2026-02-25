import React, {useEffect, useState, useMemo, useCallback} from 'react';
import {FlatList, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@shopify/restyle';
import {Screen, SearchInput, EmptyState, SkeletonRow, Divider, Box, Text} from '../../theme';
import type {Theme} from '../../theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {PersonRow} from '../../components/social';
import {getPeople, getGroups, getSharingRules} from '../../services/SocialService';
import {computeAllowedReasonForFriend} from '../../types/sharing';
import type {Person, Group} from '../../types/social';
import type {SharingRule} from '../../types/sharing';

export default function PeopleScreen() {
  const navigation = useNavigation<any>();
  const theme = useTheme<Theme>();
  const insets = useSafeAreaInsets();
  const [people, setPeople] = useState<Person[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [rules, setRules] = useState<SharingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    const [p, g, r] = await Promise.all([
      getPeople(),
      getGroups(),
      getSharingRules(),
    ]);
    setPeople(p);
    setGroups(g);
    setRules(r);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      loadData();
    });
    return unsub;
  }, [navigation, loadData]);

  const groupNames = useMemo(() => {
    const map: Record<string, string> = {};
    groups.forEach(g => {
      map[g.id] = g.name;
    });
    return map;
  }, [groups]);

  const filtered = useMemo(() => {
    const sorted = [...people].sort((a, b) =>
      a.displayName.localeCompare(b.displayName),
    );
    if (!search.trim()) {
      return sorted;
    }
    const q = search.toLowerCase();
    return sorted.filter(
      p =>
        p.displayName.toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q),
    );
  }, [people, search]);

  const header = (
    <Box
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      paddingHorizontal="l"
      paddingVertical="m"
      style={{paddingTop: insets.top + theme.spacing.m}}>
      <Text variant="title">People</Text>
      <TouchableOpacity
          onPress={() => navigation.navigate('FindPeople')}
          activeOpacity={0.7}>
          <Ionicons name="person-add-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
    </Box>
  );

  if (loading) {
    return (
      <Screen>
        {header}
        {[1, 2, 3, 4, 5].map(i => (
          <SkeletonRow key={i} />
        ))}
      </Screen>
    );
  }

  if (people.length === 0) {
    return (
      <Screen>
        {header}
        <EmptyState
          icon="people-outline"
          title="No people yet"
          message="Find people to follow and start sharing your location."
          actionLabel="Find People"
          onAction={() => navigation.navigate('FindPeople')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      {header}
      <SearchInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search people..."
      />
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        ItemSeparatorComponent={() => <Divider marginHorizontal="l" />}
        renderItem={({item}) => {
          const vis = computeAllowedReasonForFriend(
            item.id,
            item.groupIds,
            rules,
          );
          return (
            <PersonRow
              person={item}
              groupNames={groupNames}
              visibility={vis}
              onPress={() =>
                navigation.navigate('PersonDetail', {personId: item.id})
              }
            />
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title="No results"
            message="Try a different search term."
          />
        }
      />
    </Screen>
  );
}
