import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {ScrollView, TextInput, Alert} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Screen, Box, Text, Button, Divider, Chip, SkeletonRow} from '../../theme';
import {MemberPicker} from '../../components/social';
import {RuleEditor} from '../../components/social';
import {
  getGroup,
  getPeople,
  getSharingRules,
  updateGroup,
  deleteGroup,
  updateSharingRule,
} from '../../services/SocialService';
import {SharingMode, SharingTargetType} from '../../types/sharing';
import {useTheme} from '@shopify/restyle';
import type {Theme} from '../../theme';
import type {Person, Group} from '../../types/social';
import type {SharingRule} from '../../types/sharing';

export default function EditGroupScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const theme = useTheme<Theme>();
  const {groupId} = route.params;

  const [group, setGroup] = useState<Group | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [rules, setRules] = useState<SharingRule[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [showRuleEditor, setShowRuleEditor] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [g, p, r] = await Promise.all([
      getGroup(groupId),
      getPeople(),
      getSharingRules(),
    ]);
    if (g) {
      setGroup(g);
      setName(g.name);
      setMemberIds(g.memberIds);
    }
    setPeople(p);
    setRules(r);
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const groupRule = useMemo(
    () =>
      rules.find(
        r =>
          r.targetType === SharingTargetType.GROUP && r.targetId === groupId,
      ),
    [rules, groupId],
  );

  const hasChanges = useMemo(() => {
    if (!group) {
      return false;
    }
    if (name.trim() !== group.name) {
      return true;
    }
    const sortedOld = [...group.memberIds].sort();
    const sortedNew = [...memberIds].sort();
    if (sortedOld.length !== sortedNew.length) {
      return true;
    }
    return sortedOld.some((id, i) => id !== sortedNew[i]);
  }, [group, name, memberIds]);

  const handleSave = useCallback(async () => {
    if (!hasChanges || saving) {
      return;
    }
    setSaving(true);
    const updates: {name?: string; memberIds?: string[]} = {};
    if (name.trim() !== group?.name) {
      updates.name = name.trim();
    }
    const sortedOld = [...(group?.memberIds ?? [])].sort();
    const sortedNew = [...memberIds].sort();
    if (
      sortedOld.length !== sortedNew.length ||
      sortedOld.some((id, i) => id !== sortedNew[i])
    ) {
      updates.memberIds = memberIds;
    }
    await updateGroup(groupId, updates);
    setSaving(false);
    navigation.goBack();
  }, [hasChanges, saving, name, memberIds, group, groupId, navigation]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Group',
      `Are you sure you want to delete "${group?.name}"? This cannot be undone.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteGroup(groupId);
            navigation.popToTop();
          },
        },
      ],
    );
  }, [group, groupId, navigation]);

  const handleRuleConfirm = useCallback(
    async (mode: SharingMode, minutes?: number) => {
      await updateSharingRule(SharingTargetType.GROUP, groupId, mode, minutes);
      setShowRuleEditor(false);
      await loadData();
    },
    [groupId, loadData],
  );

  const removeMember = useCallback(
    (id: string) => {
      setMemberIds(prev => prev.filter(mid => mid !== id));
    },
    [],
  );

  if (loading) {
    return (
      <Screen>
        <SkeletonRow lines={3} />
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

  if (showMemberPicker) {
    return (
      <MemberPicker
        people={people}
        selectedIds={memberIds}
        onSelectionChange={setMemberIds}
        onDone={() => setShowMemberPicker(false)}
        title="Manage Members"
      />
    );
  }

  if (showRuleEditor) {
    return (
      <Screen>
        <Box padding="l">
          <Text variant="subtitle" marginBottom="m">
            Change rule for {group.name}
          </Text>
        </Box>
        <RuleEditor
          initialMode={groupRule?.mode ?? SharingMode.DISALLOWED}
          onConfirm={handleRuleConfirm}
          onCancel={() => setShowRuleEditor(false)}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps="handled">
        {/* Rename */}
        <Box marginHorizontal="l" marginTop="l">
          <Text variant="subtitle" style={{fontSize: 15}} marginBottom="s">
            Group Name
          </Text>
          <Box
            backgroundColor="inputBackground"
            borderRadius="s"
            paddingHorizontal="m"
            paddingVertical="xs">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Group name"
              placeholderTextColor={theme.colors.muted}
              style={{
                fontSize: 16,
                color: theme.colors.text,
                paddingVertical: 10,
              }}
            />
          </Box>
        </Box>

        <Divider marginVertical="l" marginHorizontal="l" />

        {/* Sharing Rule */}
        <Box marginHorizontal="l">
          <Box
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            marginBottom="s">
            <Text variant="subtitle" style={{fontSize: 15}}>
              Sharing Rule
            </Text>
            <Button
              label="Change"
              onPress={() => setShowRuleEditor(true)}
              variant="ghost"
            />
          </Box>
          <Text variant="caption">
            {groupRule?.mode === SharingMode.ALWAYS
              ? 'Always sharing'
              : groupRule?.mode === SharingMode.TEMPORARY
              ? 'Sharing temporarily'
              : 'Not sharing'}
          </Text>
        </Box>

        <Divider marginVertical="l" marginHorizontal="l" />

        {/* Members */}
        <Box marginHorizontal="l">
          <Box
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            marginBottom="s">
            <Text variant="subtitle" style={{fontSize: 15}}>
              Members ({memberIds.length})
            </Text>
            <Button
              label="Add"
              onPress={() => setShowMemberPicker(true)}
              variant="ghost"
              icon="person-add-outline"
            />
          </Box>
          <Box flexDirection="row" flexWrap="wrap" gap="s">
            {memberIds.map(id => {
              const p = people.find(pp => pp.id === id);
              return (
                <Chip
                  key={id}
                  label={p?.displayName ?? id}
                  onRemove={() => removeMember(id)}
                />
              );
            })}
          </Box>
          {memberIds.length === 0 && (
            <Text variant="caption">No members in this group.</Text>
          )}
        </Box>

        <Divider marginVertical="l" marginHorizontal="l" />

        {/* Save */}
        <Box marginHorizontal="l" marginBottom="m">
          <Button
            label={saving ? 'Saving...' : 'Done'}
            onPress={handleSave}
            variant="primary"
            disabled={!hasChanges || saving}
          />
        </Box>

        {/* Delete */}
        <Box marginHorizontal="l" marginBottom="xxl">
          <Button
            label="Delete Group"
            onPress={handleDelete}
            variant="danger"
            icon="trash-outline"
          />
        </Box>
      </ScrollView>
    </Screen>
  );
}
