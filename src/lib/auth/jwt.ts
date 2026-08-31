// Simple JWT implementation for sessions [T-11]
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

function base64UrlEncode(data: string): string {
  return Buffer.from(data, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(data: string): string {
  const padded = data + '='.repeat((4 - (data.length % 4)) % 4);
  return Buffer.from(
    padded
      .replace(/-/g, '+')
      .replace(/_/g, '/'),
    'base64',
  ).toString('utf-8');
}

export function jwtEncode<T extends Record<string, any>>(payload: T): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(payload));

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${header}.${body}.${signature}`;
}

export function jwtDecode<T = Record<string, any>>(token: string): T {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');

  const body = JSON.parse(base64UrlDecode(parts[1]));

  // Verify signature
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${parts[0]}.${parts[1]}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  if (parts[2] !== signature) throw new Error('Invalid signature');

  return body as T;
}
