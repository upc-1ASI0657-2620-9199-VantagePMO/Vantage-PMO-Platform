import { User } from '../../../domain/model/aggregates/user';

export interface IssuedToken {
  token: string;
  expiresIn: number;
}

/** Outbound port: issues signed session tokens (implemented with JWT, US41). */
export abstract class TokenService {
  abstract issue(user: User): IssuedToken;
}
