import {AUTH_CONFIG} from '../config/auth';
import {getAccessToken} from './AuthService';

export type ApiFetchOptions = RequestInit & {
  asJson?: boolean; // if true and body is object, stringify and set JSON headers
};

function buildUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const base = AUTH_CONFIG.apiBaseUrl?.replace(/\/$/, '') ?? '';
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

/**
 * Fetch helper that automatically injects the Bearer token and base URL.
 * Optionally handles JSON serialization if `asJson` is true or body is a plain object.
 */
export async function apiFetch(path: string, options: ApiFetchOptions = {}): Promise<Response> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('User is not authenticated');
  }

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);

  let body = options.body as any;
  const wantsJson = options.asJson === true || (body && typeof body === 'object' && !(body instanceof FormData));
  if (wantsJson) {
    headers.set('Content-Type', headers.get('Content-Type') || 'application/json');
    if (body && typeof body === 'object' && !(body instanceof FormData)) {
      body = JSON.stringify(body);
    }
  }

  const url = buildUrl(path);
  return fetch(url, {
    ...options,
    headers,
    body,
  });
}

/** Convenience wrapper to parse JSON responses with error handling. */
export async function apiFetchJson<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const res = await apiFetch(path, options);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText}${text ? `: ${text}` : ''}`);
  }
  return res.json() as Promise<T>;
}
