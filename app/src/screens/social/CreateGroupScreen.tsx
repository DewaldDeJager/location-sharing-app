import React, {useState, useEffect, useCallback} from 'react';
import {ScrollView, TextInput} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Screen, Box, Text, Button, Divider} from '../../theme';
import {RuleEditor, MemberPicker} from '../../components/social';
import {createGroup, getPeople} from '../../services/SocialService';
import {SharingMode} from '../../types/sharing';
import {useTheme} from '@shopify/restyle';
import type {Theme} from '../../theme';
import type {Person} from '../../types/social';

export default function CreateGroupScreen() {
  const navigation = useNavigation<any>();
  const theme = useTheme<Theme>();
  const [name, setName] = useState('');
  const [selectedMode, setSelectedMode] = useState<SharingMode>(SharingMode.DISALLOWED);
  const [temporaryMinutes, setTemporaryMinutes] = useState<number | undefined>();
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getPeople().then(setPeople);
  }, []);

  const isValid = name.trim().length > 0;

  const handleCreate = useCallback(async () => {
    if (!isValid || creating) {
      return;
    }
    setCreating(true);
    await createGroup(name.trim(), memberIds, selectedMode, temporaryMinutes);
    setCreating(false);
    navigation.goBack();
  }, [name, memberIds, selectedMode, temporaryMinutes, isValid, creating, navigation]);

  if (showMemberPicker) {
    return (
      <MemberPicker
        people={people}
        selectedIds={memberIds}
        onSelectionChange={setMemberIds}
        onDone={() => setShowMemberPicker(false)}
        title="Add Members"
      />
    );
  }

  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps="handled">
        {/* Group Name */}
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
              placeholder="Enter group name"
              placeholderTextColor={theme.colors.muted}
              style={{
                fontSize: 16,
                color: theme.colors.text,
                paddingVertical: 10,
              }}
              autoFocus
            />
          </Box>
        </Box>

        <Divider marginVertical="l" marginHorizontal="l" />

        {/* Sharing Rule */}
        <Box marginHorizontal="l" marginBottom="s">
          <Text variant="subtitle" style={{fontSize: 15}} marginBottom="s">
            Sharing Rule
          </Text>
        </Box>
        <RuleEditor
          initialMode={SharingMode.DISALLOWED}
          onConfirm={(mode, minutes) => {
            setSelectedMode(mode);
            setTemporaryMinutes(minutes);
          }}
          hideButtons
        />

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
              label="Add Members"
              onPress={() => setShowMemberPicker(true)}
              variant="ghost"
              icon="person-add-outline"
            />
          </Box>
          {memberIds.length === 0 && (
            <Text variant="caption">
              No members added yet. You can add members now or later.
            </Text>
          )}
          {memberIds.length > 0 && (
            <Text variant="caption">
              {memberIds
                .map(id => people.find(p => p.id === id)?.displayName)
                .filter(Boolean)
                .join(', ')}
            </Text>
          )}
        </Box>

        <Divider marginVertical="l" marginHorizontal="l" />

        {/* Create Button */}
        <Box marginHorizontal="l" marginBottom="xxl">
          <Button
            label={creating ? 'Creating...' : 'Create Group'}
            onPress={handleCreate}
            variant="primary"
            disabled={!isValid || creating}
          />
        </Box>
      </ScrollView>
    </Screen>
  );
}
