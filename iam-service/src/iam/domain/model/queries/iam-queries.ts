export class GetAllUsersQuery {}

export class GetUserByIdQuery {
  constructor(public readonly userId: string) {}
}
