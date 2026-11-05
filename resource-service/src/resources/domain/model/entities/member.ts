/**
 * Local replica of a team member, owned by IAM and kept in sync through iam.user-registered.
 * Resource Management never calls IAM synchronously (autonomy of the bounded context).
 */
export interface Member {
  id: string;
  fullName: string;
  email: string;
  role: string;
}
