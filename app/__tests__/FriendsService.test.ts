import {fetchFriends} from '../src/services/FriendsService';
import {getAccessToken} from '../src/services/AuthService';
import {AUTH_CONFIG} from '../src/config/auth';

jest.mock('../src/services/AuthService');

const MOCK_DATA = {
  generatedAt: '2026-02-15T22:03:12Z',
  groups: [
    {id: 'g_family', name: 'Family', sortOrder: 10},
    {id: 'g_close', name: 'Close Friends', sortOrder: 20},
    {id: 'g_friends', name: 'Friends', sortOrder: 30},
  ],
  friends: [
    {
      id: 'f_001',
      username: 'mia_nkosi',
      displayName: 'Mia Nkosi',
      lastLocation: {lat: -26.2041, lng: 28.0473},
      lastLocationAt: '2026-02-15T21:58:41Z',
      groupIds: ['g_close', 'g_friends'],
    },
  ],
};

describe('FriendsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAccessToken as jest.Mock).mockResolvedValue('fake-token');
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_DATA,
    });
  });

  test('fetchFriends calls API with token and returns data', async () => {
    const data = await fetchFriends();

    expect(getAccessToken).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith(
      `${AUTH_CONFIG.apiBaseUrl}/friends`,
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer fake-token',
        },
      }),
    );
    expect(data).toEqual(MOCK_DATA);
  });

  test('fetchFriends throws if not authenticated', async () => {
    (getAccessToken as jest.Mock).mockResolvedValue(null);

    await expect(fetchFriends()).rejects.toThrow('User is not authenticated');
  });

  test('fetchFriends throws if API call fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      statusText: 'Not Found',
    });

    await expect(fetchFriends()).rejects.toThrow('Failed to fetch friends: Not Found');
  });
});
