/** Integration events published by the IAM bounded context. */
export const IamEvents = {
  USER_REGISTERED: 'iam.user-registered',
} as const;

/** Only the public profile travels: credentials never leave the IAM context. */
export interface UserRegisteredPayload {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  replay?: boolean;
}
