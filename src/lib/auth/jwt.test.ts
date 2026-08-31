// JWT encoding/decoding tests [T-11]
import { describe, it, expect } from 'vitest';
import { jwtEncode, jwtDecode } from './jwt';

describe('JWT', () => {
  it('encodes and decodes payload', () => {
    const payload = { athleteId: 'test-123', email: 'test@example.com', iat: 123456 };
    const token = jwtEncode(payload);
    const decoded = jwtDecode(token);
    expect(decoded).toEqual(payload);
  });

  it('throws on invalid token format', () => {
    expect(() => jwtDecode('invalid-token')).toThrow('Invalid token');
  });

  it('throws on tampered payload', () => {
    const payload = { athleteId: 'test-123', email: 'test@example.com' };
    const token = jwtEncode(payload);
    const parts = token.split('.');
    // Tamper with the body
    parts[1] = Buffer.from('{"athleteId":"hacked"}').toString('base64url');
    const tamperedToken = parts.join('.');
    expect(() => jwtDecode(tamperedToken)).toThrow('Invalid signature');
  });

  it('encodes complex objects', () => {
    const payload = {
      athleteId: 'abc-123',
      email: 'test@example.com',
      role: 'ATHLETE',
      iat: 1234567890,
      exp: 1234567890 + 3600,
    };
    const token = jwtEncode(payload);
    const decoded = jwtDecode(token);
    expect(decoded).toEqual(payload);
  });
});
