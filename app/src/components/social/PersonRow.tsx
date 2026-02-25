import React from 'react';
import {TouchableOpacity} from 'react-native';
import {Box, Text, Chip, Badge} from '../../theme';
import {Avatar} from './Avatar';
import type {Person, VisibilityInfo} from '../../types/social';

type PersonRowProps = {
  person: Person;
  groupNames?: Record<string, string>;
  visibility?: VisibilityInfo;
  onPress?: () => void;
  compact?: boolean;
  rightElement?: React.ReactNode;
};

const visibilityBadge: Record<
  string,
  {label: string; variant: 'success' | 'warning' | 'neutral' | 'primary'}
> = {
  public: {label: 'Public', variant: 'primary'},
  direct: {label: 'Direct', variant: 'success'},
  group: {label: 'Group', variant: 'success'},
  none: {label: 'Not sharing', variant: 'neutral'},
};

export function PersonRow({
  person,
  groupNames = {},
  visibility,
  onPress,
  compact = false,
  rightElement,
}: PersonRowProps) {
  const chips = person.groupIds
    .map(gid => groupNames[gid])
    .filter(Boolean) as string[];
  const visibleChips = chips.slice(0, 2);
  const overflowCount = chips.length - 2;

  const content = (
    <Box
      flexDirection="row"
      alignItems="center"
      paddingVertical="m"
      paddingHorizontal="l">
      <Avatar name={person.displayName} size={compact ? 36 : 44} />
      <Box flex={1} marginLeft="m">
        <Box flexDirection="row" alignItems="center">
          <Text
            variant={compact ? 'body' : 'subtitle'}
            style={{fontSize: compact ? 15 : 16}}
            numberOfLines={1}>
            {person.displayName}
          </Text>
          {visibility && (
            <Box marginLeft="s">
              <Badge
                label={
                  visibility.reason === 'group' && visibility.groupName
                    ? `via ${visibility.groupName}`
                    : visibilityBadge[visibility.reason].label
                }
                variant={visibilityBadge[visibility.reason].variant}
              />
            </Box>
          )}
        </Box>
        <Text variant="caption" numberOfLines={1}>
          @{person.username}
        </Text>
        {!compact && visibleChips.length > 0 && (
          <Box flexDirection="row" marginTop="xs" gap="xs" flexWrap="wrap">
            {visibleChips.map(name => (
              <Chip key={name} label={name} />
            ))}
            {overflowCount > 0 && (
              <Chip label={`+${overflowCount}`} color="muted" />
            )}
          </Box>
        )}
      </Box>
      {rightElement && <Box marginLeft="s">{rightElement}</Box>}
    </Box>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.6}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}
