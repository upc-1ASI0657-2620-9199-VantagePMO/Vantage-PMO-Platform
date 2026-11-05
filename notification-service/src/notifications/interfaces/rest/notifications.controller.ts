import { Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser, CurrentUser } from '../../../shared/interfaces/rest/auth/authenticated-user';
import { JwtAuthGuard } from '../../../shared/interfaces/rest/auth/jwt-auth.guard';
import { NotificationCommandService } from '../../application/internal/command-services/notification-command.service';
import { NotificationQueryService } from '../../application/internal/query-services/notification-query.service';
import { MarkAllNotificationsAsReadCommand, MarkNotificationAsReadCommand } from '../../domain/model/commands/notification-commands';
import { GetMyNotificationsQuery, GetUnreadCountQuery } from '../../domain/model/queries/notification-queries';
import {
  MarkAllReadResultResource, NotificationPageResource, NotificationQueryResource, NotificationResource, UnreadCountResource,
} from './resources/notification.resources';
import { NotificationAssembler } from './transform/notification.assembler';

@ApiTags('Notifications')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Missing or invalid JWT' })
@UseGuards(JwtAuthGuard)
@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(
    private readonly commands: NotificationCommandService,
    private readonly queries: NotificationQueryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List the notifications of the signed-in user, newest first' })
  @ApiOkResponse({ type: NotificationPageResource })
  async mine(@Query() q: NotificationQueryResource, @CurrentUser() user: AuthenticatedUser): Promise<NotificationPageResource> {
    const page = q.page ?? 1;
    const size = q.size ?? 20;
    const { items, total } = await this.queries.handleGetMine(new GetMyNotificationsQuery(user.id, q.unread ?? false, page, size));
    return { items: items.map(NotificationAssembler.toResource), page, size, totalItems: total };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Number of unread notifications: drives the red dot of the bell (US63)' })
  @ApiOkResponse({ type: UnreadCountResource })
  async unreadCount(@CurrentUser() user: AuthenticatedUser): Promise<UnreadCountResource> {
    const unread = await this.queries.handleGetUnreadCount(new GetUnreadCountQuery(user.id));
    return { unread, hasUnread: unread > 0 };
  }

  @Patch('read-all')
  @HttpCode(200)
  @ApiOperation({ summary: 'Mark every notification of the user as read' })
  @ApiOkResponse({ type: MarkAllReadResultResource })
  async readAll(@CurrentUser() user: AuthenticatedUser): Promise<MarkAllReadResultResource> {
    return { updated: await this.commands.handleMarkAllAsRead(new MarkAllNotificationsAsReadCommand(user.id)) };
  }

  @Patch(':notificationId/read')
  @HttpCode(200)
  @ApiOperation({ summary: 'Mark one notification as read' })
  @ApiOkResponse({ type: NotificationResource })
  @ApiResponse({ status: 404, description: 'Notification not found for this user' })
  async read(@Param('notificationId', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser): Promise<NotificationResource> {
    return NotificationAssembler.toResource(await this.commands.handleMarkAsRead(new MarkNotificationAsReadCommand(id, user.id)));
  }
}
