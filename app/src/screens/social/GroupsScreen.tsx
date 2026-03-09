import React, {useEffect, useState, useMemo, useCallback} from 'react';
import {FlatList, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@shopify/restyle';
import {Screen, SearchInput, EmptyState, SkeletonRow, Box, Text} from '../../theme';
import type {Theme} from '../../theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {GroupCard} from '../../components/social';
import {getPeople, getGroups, getSharingRules} from '../../services/SocialService';
import {SharingTargetType} from '../../types/sharing';
import type {Person, Group} from '../../types/social';
import type {SharingRule} from '../../types/sharing';

export default function GroupsScreen() {
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
      getGroups(true),
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

  const peopleMap = useMemo(() => {
    const map: Record<string, Person> = {};
    people.forEach(p => {
      map[p.id] = p;
    });
    return map;
  }, [people]);

  const filtered = useMemo(() => {
    if (!search.trim()) {
      return groups;
    }
    const q = search.toLowerCase();
    return groups.filter(g => g.name.toLowerCase().includes(q));
  }, [groups, search]);

  const header = (
    <Box
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      paddingHorizontal="l"
      paddingVertical="m"
      style={{paddingTop: insets.top + theme.spacing.m}}>
      <Text variant="title">Groups</Text>
      <TouchableOpacity
          onPress={() => navigation.navigate('CreateGroup')}
          activeOpacity={0.7}>
          <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
    </Box>
  );

  if (loading) {
    return (
      <Screen>
        {header}
        {[1, 2, 3].map(i => (
          <SkeletonRow key={i} lines={3} />
        ))}
      </Screen>
    );
  }

  if (groups.length === 0) {
    return (
      <Screen>
        {header}
        <EmptyState
          icon="people-circle-outline"
          title="No groups yet"
          message="Create a group to organize your people and manage sharing."
          actionLabel="Create Group"
          onAction={() => navigation.navigate('CreateGroup')}
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
        placeholder="Search groups..."
      />
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={{paddingBottom: 16}}
        renderItem={({item}) => {
          const memberNames = item.memberIds
            .map(id => peopleMap[id]?.displayName)
            .filter(Boolean) as string[];
          const rule = rules.find(
            r =>
              r.targetType === SharingTargetType.GROUP &&
              r.targetId === item.id,
          );
          return (
            <GroupCard
              group={item}
              memberNames={memberNames}
              rule={rule}
              onPress={() =>
                navigation.navigate('GroupDetail', {groupId: item.id})
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
