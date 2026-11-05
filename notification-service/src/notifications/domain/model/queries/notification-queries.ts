export class GetMyNotificationsQuery {
  constructor(public readonly userId: string, public readonly unreadOnly = false, public readonly page = 1, public readonly size = 20) {}
}

export class GetUnreadCountQuery {
  constructor(public readonly userId: string) {}
}
