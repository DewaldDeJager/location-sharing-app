import React from 'react';
import {TouchableOpacity} from 'react-native';
import {Box, Text, Card, Badge} from '../../theme';
import {StackedAvatars} from './Avatar';
import type {Group} from '../../types/social';
import type {SharingRule} from '../../types/sharing';
import {formatRuleSummary, ruleBadgeVariant} from '../../types/sharing';

type GroupCardProps = {
  group: Group;
  memberNames: string[];
  rule?: SharingRule;
  onPress?: () => void;
};

export function GroupCard({group, memberNames, rule, onPress}: GroupCardProps) {
  const badgeLabel = rule ? formatRuleSummary(rule) : 'Not sharing';
  const badgeVariant = rule ? ruleBadgeVariant(rule) : 'neutral';

  const content = (
    <Card marginVertical="xs">
      <Box flexDirection="row" alignItems="center">
        <StackedAvatars names={memberNames} max={3} size={32} />
        <Box flex={1} marginLeft="m">
          <Text variant="subtitle" style={{fontSize: 16}} numberOfLines={1}>
            {group.name}
          </Text>
          <Text variant="caption">
            {group.memberIds.length} {group.memberIds.length === 1 ? 'member' : 'members'}
          </Text>
        </Box>
        <Badge label={badgeLabel} variant={badgeVariant} />
      </Box>
    </Card>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}
