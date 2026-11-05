import { Body, Controller, ForbiddenException, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser, CurrentUser } from '../../../shared/interfaces/rest/auth/authenticated-user';
import { JwtAuthGuard } from '../../../shared/interfaces/rest/auth/jwt-auth.guard';
import { ProjectAlertScanService } from '../../application/internal/scheduled/project-alert-scan.service';
import { AlertScanResultResource, RunAlertScanResource } from './resources/alert.resources';

@ApiTags('Alerts')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Missing or invalid JWT' })
@UseGuards(JwtAuthGuard)
@Controller('api/v1/alerts')
export class AlertsController {
  constructor(private readonly scanner: ProjectAlertScanService) {}

  @Post('scan')
  @HttpCode(200)
  @ApiOperation({ summary: 'Run the alert scan on demand: milestones due in 24 h (US09) and projects without changes in 72 h (US10, US53)' })
  @ApiOkResponse({ type: AlertScanResultResource })
  @ApiResponse({ status: 403, description: 'Only PMO_LEAD or ADMIN can trigger the scan' })
  scan(@Body() body: RunAlertScanResource, @CurrentUser() user: AuthenticatedUser): Promise<AlertScanResultResource> {
    if (!['PMO_LEAD', 'ADMIN'].includes(user.role)) throw new ForbiddenException('Only PMO_LEAD or ADMIN can trigger the alert scan.');
    return this.scanner.scan(body.asOf ? new Date(body.asOf) : new Date());
  }
}
