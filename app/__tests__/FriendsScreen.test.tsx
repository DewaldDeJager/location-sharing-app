import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {NavigationContainer} from '@react-navigation/native';
import FriendsScreen from '../src/screens/FriendsScreen';

function renderWithNavigation() {
  let tree: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(
      <NavigationContainer>
        <FriendsScreen />
      </NavigationContainer>,
    );
  });
  return tree!;
}

test('renders friend names in alphabetical view', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(
      <NavigationContainer>
        <FriendsScreen />
      </NavigationContainer>,
    );
  });

  const root = tree!.root;
  const texts = root.findAllByType('Text' as any);
  const textContents = texts.map(t => t.children.join(''));

  expect(textContents).toContain('Aisha Khan');
  expect(textContents).toContain('Liam Venter');
  expect(textContents).toContain('Mia Nkosi');
  expect(textContents).toContain('Sam');
});

test('shows group labels in alphabetical view', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(
      <NavigationContainer>
        <FriendsScreen />
      </NavigationContainer>,
    );
  });

  const root = tree!.root;
  const texts = root.findAllByType('Text' as any);
  const textContents = texts.map(t => t.children.join(''));

  // Aisha Khan has no groups, should show "Public"
  expect(textContents).toContain('Public');
  // Liam Venter is in Family
  expect(textContents).toContain('Family');
});

test('switches to grouped view and shows section headers', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(
      <NavigationContainer>
        <FriendsScreen />
      </NavigationContainer>,
    );
  });

  const root = tree!.root;

  // Find the "By Group" toggle button and press it
  const allTexts = root.findAllByType('Text' as any);
  const byGroupText = allTexts.find(
    t => t.children && t.children.includes('By Group'),
  );
  expect(byGroupText).toBeTruthy();

  // Find the ancestor with onPress
  let node = byGroupText!.parent;
  while (node && !node.props.onPress) {
    node = node.parent;
  }
  expect(node).toBeTruthy();
  await ReactTestRenderer.act(async () => {
    node!.props.onPress();
  });

  // Now verify section headers appear
  const updatedTexts = root.findAllByType('Text' as any);
  const updatedContents = updatedTexts.map(t => t.children.join(''));

  expect(updatedContents).toContain('Family');
  expect(updatedContents).toContain('Close Friends');
  expect(updatedContents).toContain('Friends');
});

test('renders View on Map button for friends with location', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(
      <NavigationContainer>
        <FriendsScreen />
      </NavigationContainer>,
    );
  });

  const root = tree!.root;
  const texts = root.findAllByType('Text' as any);
  const textContents = texts.map(t => t.children.join(''));

  // Friends with location should have "View on Map" buttons
  const viewOnMapCount = textContents.filter(t => t === 'View on Map').length;
  // Mia, Liam, Sam have locations; Aisha does not
  expect(viewOnMapCount).toBe(3);
});

test('renders View Profile button for every friend', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(
      <NavigationContainer>
        <FriendsScreen />
      </NavigationContainer>,
    );
  });

  const root = tree!.root;
  const texts = root.findAllByType('Text' as any);
  const textContents = texts.map(t => t.children.join(''));

  // All 4 friends should have "View Profile" buttons
  const viewProfileCount = textContents.filter(
    t => t === 'View Profile',
  ).length;
  expect(viewProfileCount).toBe(4);
});
