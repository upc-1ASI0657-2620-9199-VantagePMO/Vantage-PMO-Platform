export class MarkNotificationAsReadCommand {
  constructor(public readonly notificationId: string, public readonly userId: string) {}
}

export class MarkAllNotificationsAsReadCommand {
  constructor(public readonly userId: string) {}
}
