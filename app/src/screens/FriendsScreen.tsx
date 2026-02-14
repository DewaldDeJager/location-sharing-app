import React, {useEffect, useState, useMemo} from 'react';
import {
  StyleSheet,
  View,
  Text,
  SectionList,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {fetchFriends} from '../services/FriendsService';
import type {Friend, Group} from '../services/FriendsService';

type ViewMode = 'alphabetical' | 'grouped';

function FriendsScreen() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('alphabetical');

  useEffect(() => {
    fetchFriends().then(data => {
      setFriends(data.friends);
      setGroups(data.groups);
      setLoading(false);
    });
  }, []);

  const groupMap = useMemo(() => {
    const map: Record<string, string> = {};
    groups.forEach(g => {
      map[g.id] = g.name;
    });
    return map;
  }, [groups]);

  const sortedFriends = useMemo(
    () =>
      [...friends].sort((a, b) =>
        a.displayName.localeCompare(b.displayName),
      ),
    [friends],
  );

  const sections = useMemo(() => {
    const sortedGroups = [...groups].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );

    const result = sortedGroups.map(group => ({
      title: group.name,
      data: friends
        .filter(f => f.groupIds.includes(group.id))
        .sort((a, b) => a.displayName.localeCompare(b.displayName)),
    }));

    const ungrouped = friends.filter(f => f.groupIds.length === 0);
    if (ungrouped.length > 0) {
      result.push({
        title: 'Public',
        data: ungrouped.sort((a, b) =>
          a.displayName.localeCompare(b.displayName),
        ),
      });
    }

    return result;
  }, [friends, groups]);

  const getGroupLabels = (groupIds: string[]): string => {
    if (groupIds.length === 0) {
      return 'Public';
    }
    return groupIds
      .map(id => groupMap[id] || id)
      .join(', ');
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'alphabetical' && styles.toggleButtonActive,
          ]}
          onPress={() => setViewMode('alphabetical')}>
          <Text
            style={[
              styles.toggleText,
              viewMode === 'alphabetical' && styles.toggleTextActive,
            ]}>
            Alphabetical
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'grouped' && styles.toggleButtonActive,
          ]}
          onPress={() => setViewMode('grouped')}>
          <Text
            style={[
              styles.toggleText,
              viewMode === 'grouped' && styles.toggleTextActive,
            ]}>
            By Group
          </Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'alphabetical' ? (
        <FlatList
          data={sortedFriends}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <View style={styles.friendCard}>
              <Text style={styles.friendName}>{item.displayName}</Text>
              <Text style={styles.friendGroups}>
                {getGroupLabels(item.groupIds)}
              </Text>
            </View>
          )}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          renderSectionHeader={({section: {title}}) => (
            <Text style={styles.sectionHeader}>{title}</Text>
          )}
          renderItem={({item}) => (
            <View style={styles.friendCard}>
              <Text style={styles.friendName}>{item.displayName}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    padding: 12,
    justifyContent: 'center',
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#4a90d9',
  },
  toggleText: {
    fontSize: 14,
    color: '#333',
  },
  toggleTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  friendCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 14,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  friendGroups: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4a90d9',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
});

export default FriendsScreen;
