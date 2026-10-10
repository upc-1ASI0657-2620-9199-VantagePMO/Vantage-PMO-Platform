/** Outbound port: one-way password hashing (implemented with BCrypt, US51). */
export abstract class HashingService {
  abstract hash(plain: string): Promise<string>;
  abstract verify(plain: string, hash: string): Promise<boolean>;
}
