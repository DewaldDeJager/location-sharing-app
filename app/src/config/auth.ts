import {
  COGNITO_DOMAIN,
  COGNITO_CLIENT_ID,
  COGNITO_REGION,
  API_BASE_URL,
} from '@env';

export const AUTH_CONFIG = {
  cognitoDomain: COGNITO_DOMAIN,
  clientId: COGNITO_CLIENT_ID,
  region: COGNITO_REGION,
  apiBaseUrl: API_BASE_URL,

  authorizationEndpoint: `${COGNITO_DOMAIN}/oauth2/authorize`,
  tokenEndpoint: `${COGNITO_DOMAIN}/oauth2/token`,
  revocationEndpoint: `${COGNITO_DOMAIN}/oauth2/revoke`,

  scopes: ['openid', 'email', 'profile'],
  redirectUrl: 'myapp://auth/callback',
  logoutRedirectUrl: 'myapp://auth/logout',
};
