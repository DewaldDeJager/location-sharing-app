import {authorize, refresh, revoke} from 'react-native-app-auth';
import * as Keychain from 'react-native-keychain';
import {AUTH_CONFIG} from '../config/auth';

const KEYCHAIN_SERVICE = 'com.locationsharingapp.auth';

type StoredTokens = {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  accessTokenExpirationDate: string;
};

const oauthConfig = {
  clientId: AUTH_CONFIG.clientId,
  redirectUrl: AUTH_CONFIG.redirectUrl,
  scopes: AUTH_CONFIG.scopes,
  serviceConfiguration: {
    authorizationEndpoint: AUTH_CONFIG.authorizationEndpoint,
    tokenEndpoint: AUTH_CONFIG.tokenEndpoint,
    revocationEndpoint: AUTH_CONFIG.revocationEndpoint,
  },
  usePKCE: true,
  dangerouslyAllowInsecureHttpRequests: false,
};

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const payload = parts[1];
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function isTokenExpired(expirationDate: string): boolean {
  const expiry = new Date(expirationDate).getTime();
  const now = Date.now();
  // Consider expired 60 seconds before actual expiry
  return now >= expiry - 60 * 1000;
}

async function storeTokens(tokens: StoredTokens): Promise<void> {
  await Keychain.setGenericPassword(
    'auth_tokens',
    JSON.stringify(tokens),
    {service: KEYCHAIN_SERVICE},
  );
}

async function getStoredTokens(): Promise<StoredTokens | null> {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: KEYCHAIN_SERVICE,
    });
    if (credentials && credentials.password) {
      return JSON.parse(credentials.password) as StoredTokens;
    }
    return null;
  } catch {
    return null;
  }
}

async function clearTokens(): Promise<void> {
  await Keychain.resetGenericPassword({service: KEYCHAIN_SERVICE});
}

/**
 * Sign in using Cognito Hosted UI (supports Google federated login and
 * email/password). Uses Authorization Code + PKCE flow.
 */
export async function signIn(): Promise<StoredTokens> {
  const result = await authorize(oauthConfig);

  const tokens: StoredTokens = {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    idToken: result.idToken,
    accessTokenExpirationDate: result.accessTokenExpirationDate,
  };

  await storeTokens(tokens);
  return tokens;
}

/**
 * Sign out: revoke the refresh token and clear stored credentials.
 */
export async function signOut(): Promise<void> {
  const tokens = await getStoredTokens();
  if (tokens?.refreshToken) {
    try {
      await revoke(oauthConfig, {
        tokenToRevoke: tokens.refreshToken,
        sendClientId: true,
      });
    } catch {
      // Best-effort revocation; continue with local cleanup
    }
  }
  await clearTokens();
}

/**
 * Refresh tokens using the stored refresh token.
 * Throws if no refresh token is available or if the refresh fails.
 */
export async function refreshTokens(): Promise<StoredTokens> {
  const tokens = await getStoredTokens();
  if (!tokens?.refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const result = await refresh(oauthConfig, {
      refreshToken: tokens.refreshToken,
    });

    const newTokens: StoredTokens = {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken || tokens.refreshToken,
      idToken: result.idToken,
      accessTokenExpirationDate: result.accessTokenExpirationDate,
    };

    await storeTokens(newTokens);
    return newTokens;
  } catch (error) {
    // Refresh token is invalid or expired — clear and re-throw
    await clearTokens();
    throw error;
  }
}

/**
 * Get a valid access token. Automatically refreshes if the current token
 * is expired or about to expire.
 * Returns null if the user is not authenticated.
 */
export async function getAccessToken(): Promise<string | null> {
  let tokens = await getStoredTokens();
  if (!tokens) {
    return null;
  }

  if (isTokenExpired(tokens.accessTokenExpirationDate)) {
    try {
      tokens = await refreshTokens();
    } catch {
      return null;
    }
  }

  return tokens.accessToken;
}

/**
 * Check whether the user is currently authenticated (has stored tokens).
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  return token !== null;
}

/**
 * Get the current user's sub claim from the stored ID token.
 * Returns null if no valid ID token is available.
 */
export function getUserSub(idToken: string): string | null {
  const payload = decodeJwtPayload(idToken);
  return payload?.sub ?? null;
}

/**
 * Get the current user's email from the stored ID token.
 * Returns null if no valid ID token is available.
 */
export function getUserEmail(idToken: string): string | null {
  const payload = decodeJwtPayload(idToken);
  return payload?.email ?? null;
}

/**
 * Retrieve the stored tokens without refreshing.
 */
export async function getTokens(): Promise<StoredTokens | null> {
  return getStoredTokens();
}
