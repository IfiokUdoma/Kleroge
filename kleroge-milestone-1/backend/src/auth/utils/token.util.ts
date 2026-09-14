import { createHash } from 'crypto';

/** Refresh tokens are stored hashed (SHA-256), same principle as passwords — see RefreshToken entity comment. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Parses simple Nest/JWT-style duration strings ("15m", "7d", "1h") into milliseconds. */
export function parseDurationToMs(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration.trim());
  if (!match) {
    throw new Error(`Invalid duration format: "${duration}". Use formats like 15m, 1h, 7d.`);
  }
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const unitMs: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * unitMs[unit];
}
