export enum KycDocumentType {
  PASSPORT = 'passport',
  NATIONAL_ID = 'national_id',
  PROOF_OF_ADDRESS = 'proof_of_address',
  SELFIE = 'selfie',
}

export enum KycDocumentStatus {
  UPLOADED = 'uploaded',
  UNDER_REVIEW = 'under_review',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

/** Allowed MIME types for KYC uploads */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

/** Max file size: 10MB */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** Required document types that must all be uploaded before KYC can be submitted */
export const REQUIRED_DOCUMENT_TYPES = [
  KycDocumentType.PASSPORT,
  KycDocumentType.PROOF_OF_ADDRESS,
  KycDocumentType.SELFIE,
];
