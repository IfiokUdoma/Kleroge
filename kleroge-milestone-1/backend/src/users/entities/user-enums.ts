/**
 * A user's role determines what they can do on the platform.
 * Admin is Kleroge's internal trust & compliance team — never a government
 * entity and never automatically assigned at signup.
 */
export enum UserRole {
  BUYER = 'buyer',
  SELLER = 'seller',
  ADMIN = 'admin',
}

/**
 * KYC verification status. Lives on the user, separate from account status,
 * because a user can be logged in and browsing (account active) while KYC
 * is still pending — they just can't transact yet.
 */
export enum KycStatus {
  NOT_STARTED = 'not_started',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/**
 * Account-level status, independent of KYC. Lets us lock/disable an account
 * (e.g. suspected ATO, ban) without losing KYC history, and revoke active
 * sessions immediately via the JWT version field below.
 */
export enum AccountStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
}
