import { cookies } from 'next/headers';

const AUTH_COOKIE = 'wp_jwt';

export function setAuthCookie(token: string) {
  cookies().set(AUTH_COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/', secure: true, maxAge: 60 * 60 * 24 * 7 });
}

export function getAuthToken(): string | null {
  return cookies().get(AUTH_COOKIE)?.value || null;
}

export function clearAuthCookie() {
  cookies().delete(AUTH_COOKIE);
}


