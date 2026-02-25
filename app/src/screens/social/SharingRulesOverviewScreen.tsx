import React, {useEffect, useState, useCallback, useMemo} from 'react';
import {ScrollView} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@shopify/restyle';
import {Screen, Box, Text, Card, Badge, Button, Divider, SkeletonRow} from '../../theme';
import type {Theme} from '../../theme';
import {RuleEditor} from '../../components/social';
import {getSharingRules, updateSharingRule, stopSharing} from '../../services/SocialService';
import {
  SharingMode,
  SharingTargetType,
  formatRuleSummary,
  ruleBadgeVariant,
  isTemporaryActive,
} from '../../types/sharing';
import type {SharingRule} from '../../types/sharing';

export default function SharingRulesOverviewScreen() {
  const navigation = useNavigation<any>();
  const theme = useTheme<Theme>();
  const insets = useSafeAreaInsets();
  const [rules, setRules] = useState<SharingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTarget, setEditingTarget] = useState<{
    targetType: SharingTargetType;
    targetId?: string;
  } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const r = await getSharingRules();
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

  const publicRule = useMemo(
    () => rules.find(r => r.targetType === SharingTargetType.PUBLIC),
    [rules],
  );

  const groupRules = useMemo(
    () => rules.filter(r => r.targetType === SharingTargetType.GROUP),
    [rules],
  );

  const userRules = useMemo(
    () => rules.filter(r => r.targetType === SharingTargetType.USER),
    [rules],
  );

  const activeGroupRules = useMemo(
    () =>
      groupRules.filter(
        r =>
          r.mode === SharingMode.ALWAYS ||
          (r.mode === SharingMode.TEMPORARY && isTemporaryActive(r)),
      ),
    [groupRules],
  );

  const activeUserRules = useMemo(
    () =>
      userRules.filter(
        r =>
          r.mode === SharingMode.ALWAYS ||
          (r.mode === SharingMode.TEMPORARY && isTemporaryActive(r)),
      ),
    [userRules],
  );

  const handleConfirmRule = useCallback(
    async (mode: SharingMode, minutes?: number) => {
      if (!editingTarget) {
        return;
      }
      await updateSharingRule(
        editingTarget.targetType,
        editingTarget.targetId,
        mode,
        minutes,
      );
      setEditingTarget(null);
      await loadData();
    },
    [editingTarget, loadData],
  );

  const header = (
    <Box
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      paddingHorizontal="l"
      paddingVertical="m"
      style={{paddingTop: insets.top + theme.spacing.m}}>
      <Text variant="title">Sharing</Text>
    </Box>
  );

  if (loading) {
    return (
      <Screen>
        {header}
        <SkeletonRow lines={3} />
        <SkeletonRow />
        <SkeletonRow />
      </Screen>
    );
  }

  if (editingTarget) {
    const currentRule = rules.find(
      r =>
        r.targetType === editingTarget.targetType &&
        (editingTarget.targetId
          ? r.targetId === editingTarget.targetId
          : r.targetType === SharingTargetType.PUBLIC),
    );
    return (
      <Screen>
        {header}
        <Box padding="l">
          <Text variant="subtitle" marginBottom="m">
            Edit Rule
          </Text>
        </Box>
        <RuleEditor
          initialMode={currentRule?.mode ?? SharingMode.DISALLOWED}
          onConfirm={handleConfirmRule}
          onCancel={() => setEditingTarget(null)}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      {header}
      <ScrollView>
        {/* Explanation */}
        <Box paddingHorizontal="l" paddingVertical="m">
          <Text variant="caption">
            Sharing is off by default. Rules below control who can see your
            location. Sources are additive — a person can see your location if
            any applicable rule allows it.
          </Text>
        </Box>

        {/* Public Rule */}
        <Text
          variant="subtitle"
          style={{fontSize: 15}}
          marginHorizontal="l"
          marginBottom="s">
          Public
        </Text>
        <Card>
          <Box
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between">
            <Box flex={1}>
              <Text variant="body" style={{fontSize: 15}}>
                Everyone
              </Text>
              <Text variant="caption">
                {publicRule ? formatRuleSummary(publicRule) : 'Not sharing'}
              </Text>
            </Box>
            <Badge
              label={publicRule ? formatRuleSummary(publicRule) : 'Not sharing'}
              variant={publicRule ? ruleBadgeVariant(publicRule) : 'neutral'}
            />
          </Box>
          <Box marginTop="m">
            <Button
              label="Edit"
              onPress={() =>
                setEditingTarget({targetType: SharingTargetType.PUBLIC})
              }
              variant="outline"
            />
          </Box>
        </Card>

        <Divider marginVertical="m" marginHorizontal="l" />

        {/* Group Rules */}
        <Text
          variant="subtitle"
          style={{fontSize: 15}}
          marginHorizontal="l"
          marginBottom="s">
          Groups ({activeGroupRules.length} sharing)
        </Text>
        {groupRules.length === 0 ? (
          <Box marginHorizontal="l" marginBottom="m">
            <Text variant="caption">No group rules configured.</Text>
          </Box>
        ) : (
          groupRules.map(rule => (
            <Card key={rule.id} marginVertical="xs">
              <Box
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between">
                <Box flex={1}>
                  <Text variant="body" style={{fontSize: 15}}>
                    {rule.targetName ?? 'Unknown group'}
                  </Text>
                  <Text variant="caption">{formatRuleSummary(rule)}</Text>
                </Box>
                <Badge
                  label={formatRuleSummary(rule)}
                  variant={ruleBadgeVariant(rule)}
                />
              </Box>
              <Box marginTop="s">
                <Button
                  label="Edit"
                  onPress={() =>
                    setEditingTarget({
                      targetType: SharingTargetType.GROUP,
                      targetId: rule.targetId,
                    })
                  }
                  variant="ghost"
                />
              </Box>
            </Card>
          ))
        )}

        <Divider marginVertical="m" marginHorizontal="l" />

        {/* User Rules */}
        <Text
          variant="subtitle"
          style={{fontSize: 15}}
          marginHorizontal="l"
          marginBottom="s">
          Individual Users ({activeUserRules.length} sharing)
        </Text>
        {userRules.length === 0 ? (
          <Box marginHorizontal="l" marginBottom="m">
            <Text variant="caption">
              No individual user rules. You can set them from a person's profile.
            </Text>
          </Box>
        ) : (
          userRules.map(rule => (
            <Card key={rule.id} marginVertical="xs">
              <Box
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between">
                <Box flex={1}>
                  <Text variant="body" style={{fontSize: 15}}>
                    {rule.targetName ?? 'Unknown user'}
                  </Text>
                  <Text variant="caption">{formatRuleSummary(rule)}</Text>
                </Box>
                <Badge
                  label={formatRuleSummary(rule)}
                  variant={ruleBadgeVariant(rule)}
                />
              </Box>
              <Box marginTop="s">
                <Button
                  label="Edit"
                  onPress={() =>
                    setEditingTarget({
                      targetType: SharingTargetType.USER,
                      targetId: rule.targetId,
                    })
                  }
                  variant="ghost"
                />
              </Box>
            </Card>
          ))
        )}

        <Box height={32} />
      </ScrollView>
    </Screen>
  );
}
