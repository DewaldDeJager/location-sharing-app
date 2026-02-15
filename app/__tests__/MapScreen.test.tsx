import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import MapScreen from '../src/screens/MapScreen';
import {subscribeToLocation} from '../src/services/LocationService';

jest.mock('../src/services/LocationService', () => ({
  subscribeToLocation: jest.fn(),
}));

const mockSubscribe = subscribeToLocation as jest.Mock;

function setupLocationMock(location = {latitude: 37.78825, longitude: -122.4324}) {
  mockSubscribe.mockImplementation((callback: (loc: any) => void) => {
    callback(location);
    return jest.fn();
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('renders My Location button when location is available', async () => {
  setupLocationMock();

  let tree: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<MapScreen />);
  });

  const root = tree!.root;
  const button = root.findByProps({testID: 'my-location-button'});
  expect(button).toBeTruthy();
  expect(button.props.accessibilityLabel).toBe('My Location');
});

test('does not render My Location button while loading', async () => {
  mockSubscribe.mockImplementation(() => jest.fn());

  let tree: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<MapScreen />);
  });

  const root = tree!.root;
  const buttons = root.findAllByProps({testID: 'my-location-button'});
  expect(buttons.length).toBe(0);
});

test('My Location button triggers region change to user location', async () => {
  const userLocation = {latitude: 37.78825, longitude: -122.4324};
  setupLocationMock(userLocation);

  const friendMarkerRoute = {
    params: {
      friendMarker: {lat: -26.2041, lng: 28.0473, displayName: 'Mia'},
    },
  };

  let tree: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<MapScreen route={friendMarkerRoute} />);
  });

  const root = tree!.root;

  // Verify the map initially shows the friend's location
  const mapView = root.findByProps({testID: undefined});
  // Find the MapView (first child of container that has region prop)
  const mapViews = root.findAll(
    node => node.props.region !== undefined && node.props.onRegionChangeComplete !== undefined,
  );
  expect(mapViews.length).toBeGreaterThan(0);
  expect(mapViews[0].props.region.latitude).toBe(-26.2041);

  // Press the My Location button
  const button = root.findByProps({testID: 'my-location-button'});
  await ReactTestRenderer.act(async () => {
    button.props.onPress();
  });

  // Verify the region is now centered on the user's location
  const updatedMapViews = root.findAll(
    node => node.props.region !== undefined && node.props.onRegionChangeComplete !== undefined,
  );
  expect(updatedMapViews[0].props.region.latitude).toBe(userLocation.latitude);
  expect(updatedMapViews[0].props.region.longitude).toBe(userLocation.longitude);
});

test('map recenters when friendMarker route param changes', async () => {
  const userLocation = {latitude: 37.78825, longitude: -122.4324};
  setupLocationMock(userLocation);

  const firstFriend = {
    params: {
      friendMarker: {lat: -26.2041, lng: 28.0473, displayName: 'Mia'},
    },
  };

  let tree: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<MapScreen route={firstFriend} />);
  });

  const findMapView = () =>
    tree!.root.findAll(
      node =>
        node.props.region !== undefined &&
        node.props.onRegionChangeComplete !== undefined,
    )[0];

  // Initially shows first friend
  expect(findMapView().props.region.latitude).toBe(-26.2041);

  // Navigate to a second friend by updating route params
  const secondFriend = {
    params: {
      friendMarker: {lat: -33.9249, lng: 18.4241, displayName: 'Liam'},
    },
  };
  await ReactTestRenderer.act(async () => {
    tree!.update(<MapScreen route={secondFriend} />);
  });

  // Map should now be centered on the second friend
  expect(findMapView().props.region.latitude).toBe(-33.9249);
  expect(findMapView().props.region.longitude).toBe(18.4241);
});
