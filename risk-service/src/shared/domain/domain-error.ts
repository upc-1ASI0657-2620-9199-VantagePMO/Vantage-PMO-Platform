/**
 * Base error for business-rule (invariant) violations inside the domain model.
 * The REST layer translates it into an RFC 7807 Problem Details response.
 */
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'domain-rule-violated',
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

/** Raised when an aggregate referenced by id does not exist. */
export class ResourceNotFoundError extends DomainError {
  constructor(resource: string, id: string) {
    super(`${resource} with id '${id}' was not found.`, 'resource-not-found');
    this.name = 'ResourceNotFoundError';
  }
}

/** Raised when an operation would duplicate a unique business key. */
export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, 'conflict');
    this.name = 'ConflictError';
  }
}

/** Raised when the presented credentials are not valid. */
export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('Invalid email or password.', 'invalid-credentials');
    this.name = 'InvalidCredentialsError';
  }
}
