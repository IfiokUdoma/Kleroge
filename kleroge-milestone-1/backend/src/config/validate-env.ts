/**
 * Fails fast on boot if required secrets/config are missing.
 * This matters a lot for a platform handling KYC data and payments:
 * we never want to silently start with an empty JWT secret.
 */
export function validateEnv(): void {
  const required = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = required.filter((key) => !process.env[key] || process.env[key]?.trim() === '');

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'Copy .env.example to .env and set strong random secrets before starting the server.',
    );
  }

  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_ACCESS_SECRET === 'replace_with_a_long_random_secret') {
      throw new Error('JWT_ACCESS_SECRET is still the example placeholder. Set a real secret.');
    }
    if (process.env.JWT_REFRESH_SECRET === 'replace_with_a_different_long_random_secret') {
      throw new Error('JWT_REFRESH_SECRET is still the example placeholder. Set a real secret.');
    }
    if (process.env.DB_SSL !== 'true') {
      // eslint-disable-next-line no-console
      console.warn('[WARN] DB_SSL is not enabled in production. This is not recommended.');
    }
  }
}
