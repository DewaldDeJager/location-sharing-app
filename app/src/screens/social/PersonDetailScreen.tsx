import React, {useEffect, useState, useCallback, useMemo} from 'react';
import {ScrollView, Alert} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Screen, Box, Text, Card, Badge, Button, Chip, Divider, SkeletonRow} from '../../theme';
import {Avatar} from '../../components/social';
import {PermissionStatusCard} from '../../components/social';
import {RuleEditor} from '../../components/social';
import {
  getPeople,
  getGroups,
  getSharingRules,
  updateSharingRule,
  stopSharing,
  extendSharing,
  unfollowPerson,
  updateGroup,
} from '../../services/SocialService';
import {
  SharingMode,
  SharingTargetType,
  computeAllowedReasonForFriend,
  isTemporaryActive,
} from '../../types/sharing';
import type {Person, Group} from '../../types/social';
import type {SharingRule} from '../../types/sharing';

export default function PersonDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {personId} = route.params;

  const [person, setPerson] = useState<Person | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [rules, setRules] = useState<SharingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [people, g, r] = await Promise.all([
      getPeople(),
      getGroups(true),
      getSharingRules(),
    ]);
    setPerson(people.find(p => p.id === personId) ?? null);
    setGroups(g);
    setRules(r);
    setLoading(false);
  }, [personId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const visibility = useMemo(() => {
    if (!person) {
      return {reason: 'none' as const};
    }
    return computeAllowedReasonForFriend(person.id, person.groupIds, rules);
  }, [person, rules]);

  const userRule = useMemo(
    () =>
      rules.find(
        r =>
          r.targetType === SharingTargetType.USER && r.targetId === personId,
      ),
    [rules, personId],
  );

  // Check if person is allowed via a group (constraint: can't disable if group allows)
  const allowedViaGroup = useMemo(() => {
    if (!person) {
      return null;
    }
    for (const gid of person.groupIds) {
      const groupRule = rules.find(
        r => r.targetType === SharingTargetType.GROUP && r.targetId === gid,
      );
      if (
        groupRule &&
        (groupRule.mode === SharingMode.ALWAYS ||
          (groupRule.mode === SharingMode.TEMPORARY &&
            isTemporaryActive(groupRule)))
      ) {
        return groupRule.targetName ?? groups.find(g => g.id === gid)?.name;
      }
    }
    return null;
  }, [person, rules, groups]);

  const personGroups = useMemo(
    () => groups.filter(g => person?.groupIds.includes(g.id)),
    [groups, person],
  );

  const handleConfirmRule = useCallback(
    async (mode: SharingMode, minutes?: number) => {
      await updateSharingRule(SharingTargetType.USER, personId, mode, minutes);
      setShowEditor(false);
      await loadData();
    },
    [personId, loadData],
  );

  const handleStopSharing = useCallback(async () => {
    await stopSharing(SharingTargetType.USER, personId);
    await loadData();
  }, [personId, loadData]);

  const handleExtend = useCallback(async () => {
    await extendSharing(SharingTargetType.USER, personId, 60);
    await loadData();
  }, [personId, loadData]);

  const handleUnfollow = useCallback(() => {
    Alert.alert(
      'Unfollow',
      `Are you sure you want to unfollow ${person?.displayName}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Unfollow',
          style: 'destructive',
          onPress: async () => {
            await unfollowPerson(personId);
            navigation.goBack();
          },
        },
      ],
    );
  }, [person, personId, navigation]);

  const handleRemoveFromGroup = useCallback(
    async (groupId: string) => {
      const group = groups.find(g => g.id === groupId);
      if (!group) {
        return;
      }
      await updateGroup(groupId, {
        memberIds: group.memberIds.filter(id => id !== personId),
      });
      await loadData();
    },
    [groups, personId, loadData],
  );

  if (loading) {
    return (
      <Screen>
        <SkeletonRow lines={3} />
        <SkeletonRow />
      </Screen>
    );
  }

  if (!person) {
    return (
      <Screen>
        <Box flex={1} alignItems="center" justifyContent="center">
          <Text variant="body" color="muted">
            Person not found
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
            Sharing with {person.displayName}
          </Text>
        </Box>
        <RuleEditor
          initialMode={userRule?.mode ?? SharingMode.DISALLOWED}
          onConfirm={handleConfirmRule}
          onCancel={() => setShowEditor(false)}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView>
        {/* Profile Header */}
        <Box alignItems="center" paddingVertical="xl">
          <Avatar name={person.displayName} size={72} />
          <Text variant="title" marginTop="m">
            {person.displayName}
          </Text>
          <Text variant="caption">@{person.username}</Text>
        </Box>

        {/* Direct Sharing Rule */}
        <Box marginBottom="m">
          <Text
            variant="subtitle"
            style={{fontSize: 15}}
            marginHorizontal="l"
            marginBottom="s">
            Direct Sharing
          </Text>

          {allowedViaGroup ? (
            <Card>
              <Badge
                label={`Allowed via ${allowedViaGroup}`}
                variant="success"
              />
              <Text variant="caption" marginTop="s">
                This person can see your location through the group "
                {allowedViaGroup}". To stop sharing with them, change the group
                rule instead.
              </Text>
            </Card>
          ) : (
            <PermissionStatusCard
              rule={userRule}
              onChangeRule={() => setShowEditor(true)}
              onStopSharing={handleStopSharing}
              onExtend={handleExtend}
            />
          )}
        </Box>

        <Divider marginHorizontal="l" />

        {/* Groups */}
        <Box marginTop="m" marginBottom="l">
          <Text
            variant="subtitle"
            style={{fontSize: 15}}
            marginHorizontal="l"
            marginBottom="s">
            Groups
          </Text>
          {personGroups.length === 0 ? (
            <Box marginHorizontal="l">
              <Text variant="caption">Not in any groups</Text>
            </Box>
          ) : (
            <Box
              flexDirection="row"
              flexWrap="wrap"
              gap="s"
              marginHorizontal="l">
              {personGroups.map(g => (
                <Chip
                  key={g.id}
                  label={g.name}
                  onRemove={() => handleRemoveFromGroup(g.id)}
                />
              ))}
            </Box>
          )}
        </Box>

        <Divider marginHorizontal="l" />

        {/* Unfollow */}
        <Box padding="l" marginTop="m">
          <Button
            label="Unfollow"
            onPress={handleUnfollow}
            variant="danger"
            icon="person-remove-outline"
          />
        </Box>
      </ScrollView>
    </Screen>
  );
}
