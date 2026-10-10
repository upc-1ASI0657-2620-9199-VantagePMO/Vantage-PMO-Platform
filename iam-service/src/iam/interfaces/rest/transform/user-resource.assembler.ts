import { User } from '../../../domain/model/aggregates/user';
import { IssuedToken } from '../../../application/internal/outbound-services/token.service';
import { AuthenticatedUserResource, UserResource } from '../resources/iam.resources';

/** The password hash never leaves the bounded context. */
export class UserResourceAssembler {
  static toResource(u: User): UserResource {
    return { id: u.id, fullName: u.fullName, email: u.email, role: u.role, createdAt: u.createdAt.toISOString() };
  }

  static toAuthenticatedResource(u: User, t: IssuedToken): AuthenticatedUserResource {
    return { id: u.id, fullName: u.fullName, email: u.email, role: u.role, token: t.token, expiresIn: t.expiresIn };
  }
}
