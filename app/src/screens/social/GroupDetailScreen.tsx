import React, {useEffect, useState, useCallback, useMemo} from 'react';
import {FlatList} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Screen, Box, Text, Button, Divider, SkeletonRow} from '../../theme';
import {PersonRow, PermissionStatusCard, RuleEditor} from '../../components/social';
import {
  getPeople,
  getGroup,
  getSharingRules,
  updateSharingRule,
  stopSharing,
  extendSharing,
} from '../../services/SocialService';
import {SharingMode, SharingTargetType} from '../../types/sharing';
import type {Person, Group} from '../../types/social';
import type {SharingRule} from '../../types/sharing';

export default function GroupDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {groupId} = route.params;

  const [group, setGroup] = useState<Group | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [rules, setRules] = useState<SharingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [g, p, r] = await Promise.all([
      getGroup(groupId),
      getPeople(),
      getSharingRules(),
    ]);
    setGroup(g ?? null);
    setPeople(p);
    setRules(r);
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      loadData();
    });
    return unsub;
  }, [navigation, loadData]);

  const groupRule = useMemo(
    () =>
      rules.find(
        r =>
          r.targetType === SharingTargetType.GROUP && r.targetId === groupId,
      ),
    [rules, groupId],
  );

  const members = useMemo(() => {
    if (!group) {
      return [];
    }
    return people.filter(p => group.memberIds.includes(p.id));
  }, [people, group]);

  const handleConfirmRule = useCallback(
    async (mode: SharingMode, minutes?: number) => {
      await updateSharingRule(SharingTargetType.GROUP, groupId, mode, minutes);
      setShowEditor(false);
      await loadData();
    },
    [groupId, loadData],
  );

  const handleStopSharing = useCallback(async () => {
    await stopSharing(SharingTargetType.GROUP, groupId);
    await loadData();
  }, [groupId, loadData]);

  const handleExtend = useCallback(async () => {
    await extendSharing(SharingTargetType.GROUP, groupId, 60);
    await loadData();
  }, [groupId, loadData]);

  if (loading) {
    return (
      <Screen>
        <SkeletonRow lines={3} />
        <SkeletonRow />
        <SkeletonRow />
      </Screen>
    );
  }

  if (!group) {
    return (
      <Screen>
        <Box flex={1} alignItems="center" justifyContent="center">
          <Text variant="body" color="muted">
            Group not found
          </Text>
        </Box>
      </Screen>
    );
  }

  if (showEditor) {
    return (
      <Screen>
        <Box padding="l">
          <Text variant="subtitle" marginBottom="m">
            Sharing with {group.name}
          </Text>
        </Box>
        <RuleEditor
          initialMode={groupRule?.mode ?? SharingMode.DISALLOWED}
          onConfirm={handleConfirmRule}
          onCancel={() => setShowEditor(false)}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={members}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <Box>
            {/* Permission Status */}
            <PermissionStatusCard
              rule={groupRule}
              onChangeRule={() => setShowEditor(true)}
              onStopSharing={handleStopSharing}
              onExtend={handleExtend}
            />

            <Divider marginHorizontal="l" marginVertical="m" />

            {/* Members header */}
            <Box
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
              marginHorizontal="l"
              marginBottom="s">
              <Text variant="subtitle" style={{fontSize: 15}}>
                Members ({members.length})
              </Text>
              <Button
                label="Add"
                onPress={() =>
                  navigation.navigate('EditGroup', {groupId: group.id})
                }
                variant="ghost"
                icon="add"
              />
            </Box>
          </Box>
        }
        ItemSeparatorComponent={() => <Divider marginHorizontal="l" />}
        renderItem={({item}) => (
          <PersonRow
            person={item}
            compact
            onPress={() =>
              navigation.navigate('PersonDetail', {personId: item.id})
            }
          />
        )}
        ListFooterComponent={
          <Box padding="l" marginTop="m">
            <Button
              label="Edit Group"
              onPress={() =>
                navigation.navigate('EditGroup', {groupId: group.id})
              }
              variant="outline"
              icon="create-outline"
            />
          </Box>
        }
        ListEmptyComponent={
          <Box padding="xl" alignItems="center">
            <Text variant="caption">No members in this group yet.</Text>
          </Box>
        }
      />
    </Screen>
  );
}
