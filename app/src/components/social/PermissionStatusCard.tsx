import React from 'react';
import {Box, Text, Card, Badge, Button} from '../../theme';
import type {SharingRule} from '../../types/sharing';
import {
  SharingMode,
  formatRuleSummary,
  ruleBadgeVariant,
  isTemporaryActive,
} from '../../types/sharing';

type PermissionStatusCardProps = {
  rule?: SharingRule;
  onChangeRule: () => void;
  onStopSharing?: () => void;
  onExtend?: () => void;
};

export function PermissionStatusCard({
  rule,
  onChangeRule,
  onStopSharing,
  onExtend,
}: PermissionStatusCardProps) {
  const summary = rule ? formatRuleSummary(rule) : 'Not sharing';
  const variant = rule ? ruleBadgeVariant(rule) : 'neutral';
  const isActive =
    rule &&
    (rule.mode === SharingMode.ALWAYS ||
      (rule.mode === SharingMode.TEMPORARY && isTemporaryActive(rule)));
  const isTemp = rule?.mode === SharingMode.TEMPORARY && isTemporaryActive(rule);

  return (
    <Card>
      <Box flexDirection="row" alignItems="center" marginBottom="m">
        <Badge label={summary} variant={variant} />
        <Box flex={1} />
      </Box>

      {!isActive && (
        <Text variant="caption" marginBottom="m">
          Location sharing is off by default. Tap below to start sharing.
        </Text>
      )}

      {isTemp && (
        <Text variant="caption" marginBottom="m">
          {summary}. You can extend or stop sharing at any time.
        </Text>
      )}

      {rule?.mode === SharingMode.ALWAYS && (
        <Text variant="caption" marginBottom="m">
          Always sharing your location. Change or stop anytime.
        </Text>
      )}

      <Box flexDirection="row" gap="s">
        <Box flex={1}>
          <Button
            label={isActive ? 'Change' : 'Start sharing'}
            onPress={onChangeRule}
            variant={isActive ? 'outline' : 'primary'}
          />
        </Box>
        {isTemp && onExtend && (
          <Box flex={1}>
            <Button label="Extend" onPress={onExtend} variant="warning" />
          </Box>
        )}
        {isActive && onStopSharing && (
          <Box flex={1}>
            <Button label="Stop" onPress={onStopSharing} variant="danger" />
          </Box>
        )}
      </Box>
    </Card>
  );
}
