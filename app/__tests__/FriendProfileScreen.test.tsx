import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {NavigationContainer} from '@react-navigation/native';
import FriendProfileScreen from '../src/screens/FriendProfileScreen';

function renderWithNavigation(route: any) {
  return ReactTestRenderer.create(
    <NavigationContainer>
      <FriendProfileScreen route={route} />
    </NavigationContainer>,
  );
}

test('renders friend profile with location', async () => {
  const route = {
    params: {
      displayName: 'Mia Nkosi',
      username: 'mia_nkosi',
      lastLocation: {lat: -26.2041, lng: 28.0473},
      lastLocationAt: '2026-02-15T21:58:41Z',
    },
  };

  let tree: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = renderWithNavigation(route);
  });

  const root = tree!.root;
  const texts = root.findAllByType('Text' as any);
  const textContents = texts.map(t => t.children.join(''));

  expect(textContents).toContain('Mia Nkosi');
  expect(textContents).toContain('@mia_nkosi');
  expect(textContents.some(t => t.includes('-26.204100'))).toBe(true);
  expect(textContents.some(t => t.includes('28.047300'))).toBe(true);
  expect(textContents).toContain('Last Known Location');
  expect(textContents).toContain('Last Location Update');
});

test('renders friend profile without location', async () => {
  const route = {
    params: {
      displayName: 'Aisha Khan',
      username: 'aisha_k',
      lastLocation: null,
      lastLocationAt: null,
    },
  };

  let tree: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = renderWithNavigation(route);
  });

  const root = tree!.root;
  const texts = root.findAllByType('Text' as any);
  const textContents = texts.map(t => t.children.join(''));

  expect(textContents).toContain('Aisha Khan');
  expect(textContents).toContain('@aisha_k');
  expect(textContents).toContain('No location available');
  expect(textContents).toContain('Never');
});

test('shows View on Map button for friend with location', async () => {
  const route = {
    params: {
      displayName: 'Mia Nkosi',
      username: 'mia_nkosi',
      lastLocation: {lat: -26.2041, lng: 28.0473},
      lastLocationAt: '2026-02-15T21:58:41Z',
    },
  };

  let tree: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = renderWithNavigation(route);
  });

  const root = tree!.root;
  const texts = root.findAllByType('Text' as any);
  const textContents = texts.map(t => t.children.join(''));

  expect(textContents).toContain('View on Map');
});

test('does not show View on Map button for friend without location', async () => {
  const route = {
    params: {
      displayName: 'Aisha Khan',
      username: 'aisha_k',
      lastLocation: null,
      lastLocationAt: null,
    },
  };

  let tree: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = renderWithNavigation(route);
  });

  const root = tree!.root;
  const texts = root.findAllByType('Text' as any);
  const textContents = texts.map(t => t.children.join(''));

  expect(textContents).not.toContain('View on Map');
});
