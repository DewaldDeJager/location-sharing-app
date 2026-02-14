import {fetchFriends} from '../src/services/FriendsService';

test('fetchFriends returns groups and friends', async () => {
  const data = await fetchFriends();

  expect(data.generatedAt).toBeDefined();
  expect(data.groups.length).toBeGreaterThan(0);
  expect(data.friends.length).toBeGreaterThan(0);
});

test('each friend has required fields', async () => {
  const data = await fetchFriends();

  data.friends.forEach(friend => {
    expect(friend.id).toBeDefined();
    expect(friend.username).toBeDefined();
    expect(friend.displayName).toBeDefined();
    expect(Array.isArray(friend.groupIds)).toBe(true);
  });
});

test('groups are sorted by sortOrder', async () => {
  const data = await fetchFriends();
  const sortOrders = data.groups.map(g => g.sortOrder);

  for (let i = 1; i < sortOrders.length; i++) {
    expect(sortOrders[i]).toBeGreaterThan(sortOrders[i - 1]);
  }
});
