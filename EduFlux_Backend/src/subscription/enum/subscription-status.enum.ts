export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled', // optional: useful if user cancels manually
  PENDING = 'pending', // optional: useful while payment is being verified
}
