import React, {useState, useCallback, useRef, useEffect} from 'react';
import {FlatList, TouchableOpacity, ActivityIndicator} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Screen, Box, Text, SearchInput, Divider, EmptyState} from '../../theme';
import {Avatar} from '../../components/social';
import {searchPeople, followPerson} from '../../services/SocialService';
import {useTheme} from '@shopify/restyle';
import type {Theme} from '../../theme';
import type {PersonSearchResult} from '../../types/social';

export default function FindPeopleScreen() {
  const navigation = useNavigation<any>();
  const theme = useTheme<Theme>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PersonSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await searchPeople(q);
    setResults(res);
    setFollowingIds(new Set(res.filter(r => r.isFollowing).map(r => r.id)));
    setLoading(false);
  }, []);

  const handleQueryChange = useCallback(
    (text: string) => {
      setQuery(text);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => doSearch(text), 400);
    },
    [doSearch],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleFollow = useCallback(async (personId: string) => {
    setFollowingIds(prev => new Set(prev).add(personId));
    await followPerson(personId);
  }, []);

  return (
    <Screen>
      <SearchInput
        value={query}
        onChangeText={handleQueryChange}
        placeholder="Search by name or username..."
      />

      {loading && (
        <Box padding="xl" alignItems="center">
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </Box>
      )}

      {!loading && query.trim().length > 0 && results.length === 0 && (
        <EmptyState
          icon="search-outline"
          title="No results"
          message={`No people found for "${query}"`}
        />
      )}

      {!loading && query.trim().length === 0 && (
        <EmptyState
          icon="person-add-outline"
          title="Find people"
          message="Search by name or username to find people to follow."
        />
      )}

      <FlatList
        data={results}
        keyExtractor={item => item.id}
        ItemSeparatorComponent={() => <Divider marginHorizontal="l" />}
        renderItem={({item}) => {
          const isFollowing = followingIds.has(item.id);
          return (
            <Box
              flexDirection="row"
              alignItems="center"
              paddingVertical="m"
              paddingHorizontal="l">
              <Avatar name={item.displayName} size={40} />
              <Box flex={1} marginLeft="m">
                <Text variant="body" style={{fontSize: 15}} numberOfLines={1}>
                  {item.displayName}
                </Text>
                <Text variant="caption">@{item.username}</Text>
              </Box>
              <TouchableOpacity
                onPress={() => !isFollowing && handleFollow(item.id)}
                activeOpacity={0.7}
                disabled={isFollowing}>
                <Box
                  paddingHorizontal="l"
                  paddingVertical="s"
                  borderRadius="xl"
                  backgroundColor={isFollowing ? 'chipBackground' : 'primary'}>
                  <Text
                    variant="button"
                    style={{
                      fontSize: 13,
                      color: isFollowing
                        ? theme.colors.muted
                        : theme.colors.white,
                    }}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </Box>
              </TouchableOpacity>
            </Box>
          );
        }}
      />
    </Screen>
  );
}
