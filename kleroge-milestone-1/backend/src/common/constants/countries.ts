/**
 * MVP-supported countries, as ISO 3166-1 alpha-2 codes.
 * Kept intentionally short and explicit rather than "all 195 countries"
 * because cross-border real estate has very different KYC/AML/legal
 * requirements per country, and the PRD doesn't yet define a jurisdiction
 * model (see roadmap review). Expand this list deliberately, one country
 * at a time, as legal/compliance signs off — not by just allowing any code.
 */
export const SUPPORTED_COUNTRIES: Record<string, string> = {
  NG: 'Nigeria',
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  GH: 'Ghana',
  KE: 'Kenya',
  ZA: 'South Africa',
  AE: 'United Arab Emirates',
};

export function isSupportedCountry(code: string): boolean {
  return Object.prototype.hasOwnProperty.call(SUPPORTED_COUNTRIES, code.toUpperCase());
}
