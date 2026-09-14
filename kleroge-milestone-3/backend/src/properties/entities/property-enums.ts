export enum PropertyType {
  RESIDENTIAL  = 'residential',
  COMMERCIAL   = 'commercial',
  LAND         = 'land',
  INDUSTRIAL   = 'industrial',
  MIXED_USE    = 'mixed_use',
}

export enum ListingStatus {
  DRAFT    = 'draft',
  PENDING  = 'pending',   // submitted, awaiting admin approval
  APPROVED = 'approved',  // live and discoverable by buyers
  REJECTED = 'rejected',  // returned to seller with reason
  SOLD     = 'sold',
  DELISTED = 'delisted',  // seller removed it
}

export enum PropertyCurrency {
  USD = 'USD',
  GBP = 'GBP',
  EUR = 'EUR',
  NGN = 'NGN',
  GHS = 'GHS',
  KES = 'KES',
  ZAR = 'ZAR',
  AED = 'AED',
}
