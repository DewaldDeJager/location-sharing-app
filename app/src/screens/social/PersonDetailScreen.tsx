import React, {useEffect, useState, useCallback, useMemo} from 'react';
import {ScrollView, Alert, Modal, FlatList, TouchableOpacity} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTheme} from '@shopify/restyle';
import {Screen, Box, Text, Badge, Button, Divider, SkeletonRow} from '../../theme';
import type {Theme} from '../../theme/theme';
import {Avatar} from '../../components/social';
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
  isTemporaryActive,
  formatRuleSummary,
  ruleBadgeVariant,
} from '../../types/sharing';
import type {Person, Group} from '../../types/social';
import type {SharingRule} from '../../types/sharing';

export default function PersonDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const theme = useTheme<Theme>();
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

  const userRule = useMemo(
    () =>
      rules.find(
        r =>
          r.targetType === SharingTargetType.USER && r.targetId === personId,
      ),
    [rules, personId],
  );

  // Compute all active sharing reasons (direct + all groups)
  const activeSharingReasons = useMemo(() => {
    const reasons: Array<{type: 'direct'; rule: SharingRule} | {type: 'group'; rule: SharingRule; groupId: string; groupName: string}> = [];

    // Check direct user rule
    if (
      userRule &&
      (userRule.mode === SharingMode.ALWAYS ||
        (userRule.mode === SharingMode.TEMPORARY && isTemporaryActive(userRule)))
    ) {
      reasons.push({type: 'direct', rule: userRule});
    }

    // Check all group rules
    if (person) {
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
          const groupName = groupRule.targetName ?? groups.find(g => g.id === gid)?.name ?? gid;
          reasons.push({type: 'group', rule: groupRule, groupId: gid, groupName});
        }
      }
    }

    return reasons;
  }, [person, rules, groups, userRule]);

  const isDirectActive = useMemo(
    () =>
      !!userRule &&
      (userRule.mode === SharingMode.ALWAYS ||
        (userRule.mode === SharingMode.TEMPORARY && isTemporaryActive(userRule))),
    [userRule],
  );

  const personGroups = useMemo(
    () => groups.filter(g => person?.groupIds.includes(g.id)),
    [groups, person],
  );

  const availableGroups = useMemo(
    () => groups.filter(g => !person?.groupIds.includes(g.id)),
    [groups, person],
  );

  const [showGroupPicker, setShowGroupPicker] = useState(false);

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

  const handleAddToGroup = useCallback(
    async (groupId: string) => {
      const group = groups.find(g => g.id === groupId);
      if (!group) {
        return;
      }
      await updateGroup(groupId, {
        memberIds: [...group.memberIds, personId],
      });
      setShowGroupPicker(false);
      await loadData();
    },
    [groups, personId, loadData],
  );

  const handleNavigateToGroup = useCallback(
    (groupId: string) => {
      navigation.navigate('Groups', {screen: 'GroupDetail', params: {groupId}});
    },
    [navigation],
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

        {/* Sharing Rules */}
        <Box marginBottom="m">
          <Box
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            marginHorizontal="l"
            marginBottom="s">
            <Text variant="subtitle" style={{fontSize: 15}}>
              Sharing
            </Text>
          </Box>

          {/* Direct sharing row */}
          <TouchableOpacity onPress={() => setShowEditor(true)} activeOpacity={0.6}>
            <Box
              flexDirection="row"
              alignItems="center"
              paddingVertical="m"
              paddingHorizontal="l">
              <Box
                width={36}
                height={36}
                borderRadius="xl"
                backgroundColor="primary"
                alignItems="center"
                justifyContent="center">
                <Ionicons name="person-outline" size={18} color={theme.colors.white} />
              </Box>
              <Box flex={1} marginLeft="m">
                <Text variant="body" style={{fontSize: 15}} numberOfLines={1}>
                  Direct sharing
                </Text>
                <Text variant="caption" numberOfLines={1}>
                  {userRule ? formatRuleSummary(userRule) : 'Not sharing'}
                </Text>
              </Box>
              <Box flexDirection="row" alignItems="center" gap="xs">
                <Badge
                  label={userRule ? formatRuleSummary(userRule) : 'Off'}
                  variant={userRule ? ruleBadgeVariant(userRule) : 'neutral'}
                />
                {isDirectActive && (
                  <>
                    {userRule?.mode === SharingMode.TEMPORARY && isTemporaryActive(userRule) && (
                      <TouchableOpacity onPress={handleExtend}>
                        <Badge label="Extend" variant="warning" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={handleStopSharing}>
                      <Badge label="Stop" variant="danger" />
                    </TouchableOpacity>
                  </>
                )}
                <Ionicons name="chevron-forward" size={16} color={theme.colors.muted} />
              </Box>
            </Box>
          </TouchableOpacity>

          {/* Group sharing rows */}
          {activeSharingReasons
            .filter(r => r.type === 'group')
            .map(reason => (
              <React.Fragment key={reason.groupId}>
                <Divider marginHorizontal="l" />
                <TouchableOpacity
                  onPress={() => handleNavigateToGroup(reason.groupId)}
                  activeOpacity={0.6}>
                  <Box
                    flexDirection="row"
                    alignItems="center"
                    paddingVertical="m"
                    paddingHorizontal="l">
                    <Box
                      width={36}
                      height={36}
                      borderRadius="xl"
                      backgroundColor="success"
                      alignItems="center"
                      justifyContent="center">
                      <Ionicons name="people-outline" size={18} color={theme.colors.white} />
                    </Box>
                    <Box flex={1} marginLeft="m">
                      <Text variant="body" style={{fontSize: 15}} numberOfLines={1}>
                        {reason.groupName}
                      </Text>
                      <Text variant="caption" numberOfLines={1}>
                        {formatRuleSummary(reason.rule)}
                      </Text>
                    </Box>
                    <Box flexDirection="row" alignItems="center" gap="xs">
                      <Badge
                        label={formatRuleSummary(reason.rule)}
                        variant={ruleBadgeVariant(reason.rule)}
                      />
                      <Ionicons name="chevron-forward" size={16} color={theme.colors.muted} />
                    </Box>
                  </Box>
                </TouchableOpacity>
              </React.Fragment>
            ))}

          {activeSharingReasons.length === 0 && !isDirectActive && (
            <Box paddingHorizontal="l" paddingVertical="s">
              <Text variant="caption">
                Your location is not shared with {person.displayName}.
              </Text>
            </Box>
          )}
        </Box>

        <Divider marginHorizontal="l" />

        {/* Groups */}
        <Box marginTop="m" marginBottom="l">
          <Box
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            marginHorizontal="l"
            marginBottom="s">
            <Text variant="subtitle" style={{fontSize: 15}}>
              Groups
            </Text>
            {availableGroups.length > 0 && (
              <TouchableOpacity onPress={() => setShowGroupPicker(true)}>
                <Ionicons name="add-circle-outline" size={22} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
          </Box>

          {personGroups.length === 0 ? (
            <Box paddingHorizontal="l" paddingVertical="s">
              <Text variant="caption">Not in any groups</Text>
            </Box>
          ) : (
            personGroups.map((g, index) => (
              <React.Fragment key={g.id}>
                {index > 0 && <Divider marginHorizontal="l" />}
                <TouchableOpacity
                  onPress={() => handleNavigateToGroup(g.id)}
                  activeOpacity={0.6}>
                  <Box
                    flexDirection="row"
                    alignItems="center"
                    paddingVertical="m"
                    paddingHorizontal="l">
                    <Box
                      width={36}
                      height={36}
                      borderRadius="xl"
                      backgroundColor="chipBackground"
                      alignItems="center"
                      justifyContent="center">
                      <Ionicons name="people-outline" size={18} color={theme.colors.text} />
                    </Box>
                    <Box flex={1} marginLeft="m">
                      <Text variant="body" style={{fontSize: 15}} numberOfLines={1}>
                        {g.name}
                      </Text>
                      <Text variant="caption" numberOfLines={1}>
                        {g.memberIds.length} member{g.memberIds.length !== 1 ? 's' : ''}
                      </Text>
                    </Box>
                    <Box flexDirection="row" alignItems="center" gap="s">
                      <TouchableOpacity
                        onPress={() => handleRemoveFromGroup(g.id)}
                        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                        <Ionicons name="close-circle-outline" size={20} color={theme.colors.danger} />
                      </TouchableOpacity>
                      <Ionicons name="chevron-forward" size={16} color={theme.colors.muted} />
                    </Box>
                  </Box>
                </TouchableOpacity>
              </React.Fragment>
            ))
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

      {/* Group Picker Modal */}
      <Modal
        visible={showGroupPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowGroupPicker(false)}>
        <Box
          flex={1}
          justifyContent="flex-end"
          style={{backgroundColor: 'rgba(0,0,0,0.4)'}}>
          <Box
            backgroundColor="card"
            borderTopLeftRadius="xl"
            borderTopRightRadius="xl"
            padding="l"
            style={{maxHeight: '50%'}}>
            <Text variant="subtitle" marginBottom="m">
              Add to Group
            </Text>
            {availableGroups.length === 0 ? (
              <Text variant="caption">No available groups</Text>
            ) : (
              <FlatList
                data={availableGroups}
                keyExtractor={item => item.id}
                renderItem={({item}) => (
                  <TouchableOpacity
                    onPress={() => handleAddToGroup(item.id)}
                    style={{paddingVertical: 12}}>
                    <Text variant="body">{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
            <Box marginTop="m">
              <Button
                label="Cancel"
                onPress={() => setShowGroupPicker(false)}
                variant="outline"
              />
            </Box>
          </Box>
        </Box>
      </Modal>
    </Screen>
  );
}
