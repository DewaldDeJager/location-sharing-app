import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import LaunchScreen from '../src/screens/LaunchScreen';

test('displays the app name', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<LaunchScreen onReady={jest.fn()} />);
  });

  const root = tree!.root;
  const texts = root.findAllByType('Text' as any);
  const appNameText = texts.find(
    t => t.children && t.children.includes('Location Sharing'),
  );
  expect(appNameText).toBeTruthy();
});

test('calls onReady after location is received', async () => {
  const onReady = jest.fn();
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<LaunchScreen onReady={onReady} />);
  });

  // The mock geolocation immediately emits a position, so onReady should fire.
  expect(onReady).toHaveBeenCalled();
});
