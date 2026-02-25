import React, {useState} from 'react';
import {TouchableOpacity} from 'react-native';
import {Box, Text, Card, Button, Divider} from '../../theme';
import {SharingMode, TEMPORARY_PRESETS} from '../../types/sharing';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTheme} from '@shopify/restyle';
import type {Theme} from '../../theme';

type RuleEditorProps = {
  /** Current mode (for pre-selecting) */
  initialMode?: SharingMode;
  /** Called when user confirms a choice */
  onConfirm: (mode: SharingMode, temporaryMinutes?: number) => void;
  onCancel: () => void;
  /** Label for the confirm button (e.g. "Start sharing", "Update rule") */
  confirmLabel?: string;
};

type ModeOption = {
  mode: SharingMode;
  icon: string;
  title: string;
  description: string;
};

const modeOptions: ModeOption[] = [
  {
    mode: SharingMode.DISALLOWED,
    icon: 'eye-off-outline',
    title: 'Not sharing',
    description: 'Your location will not be visible.',
  },
  {
    mode: SharingMode.ALWAYS,
    icon: 'eye-outline',
    title: 'Always sharing',
    description: 'Share your location until you turn it off.',
  },
  {
    mode: SharingMode.TEMPORARY,
    icon: 'time-outline',
    title: 'Share temporarily',
    description: 'Share for a set duration, then stop automatically.',
  },
];

export function RuleEditor({
  initialMode = SharingMode.DISALLOWED,
  onConfirm,
  onCancel,
  confirmLabel,
}: RuleEditorProps) {
  const theme = useTheme<Theme>();
  const [selectedMode, setSelectedMode] = useState<SharingMode>(initialMode);
  const [selectedMinutes, setSelectedMinutes] = useState<number | undefined>(
    TEMPORARY_PRESETS[1].minutes,
  );

  const isUpdate = initialMode !== SharingMode.DISALLOWED;
  const buttonLabel =
    confirmLabel ??
    (selectedMode === SharingMode.DISALLOWED
      ? 'Stop sharing'
      : isUpdate
      ? 'Update rule'
      : 'Start sharing');

  return (
    <Box>
      <Text variant="caption" marginBottom="m" marginHorizontal="l">
        Choose how you want to share your location. Sharing is off by default
        for your privacy.
      </Text>

      {modeOptions.map(opt => {
        const isSelected = selectedMode === opt.mode;
        return (
          <TouchableOpacity
            key={opt.mode}
            onPress={() => setSelectedMode(opt.mode)}
            activeOpacity={0.7}>
            <Card
              marginVertical="xs"
              borderWidth={isSelected ? 2 : 1}
              borderColor={isSelected ? 'primary' : 'border'}>
              <Box flexDirection="row" alignItems="center">
                <Box
                  width={40}
                  height={40}
                  borderRadius="s"
                  alignItems="center"
                  justifyContent="center"
                  backgroundColor={isSelected ? 'primary' : 'inputBackground'}>
                  <Ionicons
                    name={opt.icon}
                    size={20}
                    color={
                      isSelected ? theme.colors.white : theme.colors.muted
                    }
                  />
                </Box>
                <Box flex={1} marginLeft="m">
                  <Text
                    variant="body"
                    style={{fontWeight: isSelected ? '600' : '400'}}>
                    {opt.title}
                  </Text>
                  <Text variant="caption">{opt.description}</Text>
                </Box>
                {isSelected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={theme.colors.primary}
                  />
                )}
              </Box>
            </Card>
          </TouchableOpacity>
        );
      })}

      {selectedMode === SharingMode.TEMPORARY && (
        <Box marginTop="m" marginHorizontal="l">
          <Text variant="caption" marginBottom="s">
            Choose duration:
          </Text>
          <Box flexDirection="row" gap="s">
            {TEMPORARY_PRESETS.map(preset => {
              const isActive = selectedMinutes === preset.minutes;
              return (
                <TouchableOpacity
                  key={preset.minutes}
                  onPress={() => setSelectedMinutes(preset.minutes)}
                  activeOpacity={0.7}
                  style={{flex: 1}}>
                  <Box
                    paddingVertical="m"
                    borderRadius="s"
                    alignItems="center"
                    backgroundColor={isActive ? 'warning' : 'inputBackground'}
                    borderWidth={isActive ? 0 : 1}
                    borderColor="border">
                    <Text
                      variant="button"
                      style={{
                        color: isActive
                          ? theme.colors.white
                          : theme.colors.text,
                      }}>
                      {preset.label}
                    </Text>
                  </Box>
                </TouchableOpacity>
              );
            })}
          </Box>
        </Box>
      )}

      <Divider marginTop="l" />

      <Box
        flexDirection="row"
        gap="s"
        marginHorizontal="l"
        marginTop="m"
        marginBottom="s">
        <Box flex={1}>
          <Button label="Cancel" onPress={onCancel} variant="ghost" />
        </Box>
        <Box flex={2}>
          <Button
            label={buttonLabel}
            onPress={() =>
              onConfirm(
                selectedMode,
                selectedMode === SharingMode.TEMPORARY
                  ? selectedMinutes
                  : undefined,
              )
            }
            variant={
              selectedMode === SharingMode.DISALLOWED ? 'outline' : 'primary'
            }
          />
        </Box>
      </Box>
    </Box>
  );
}
