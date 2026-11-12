import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser, CurrentUser } from '../../../shared/interfaces/rest/auth/authenticated-user';
import { JwtAuthGuard } from '../../../shared/interfaces/rest/auth/jwt-auth.guard';
import { ensureRole, RISK_MANAGERS } from '../../../shared/interfaces/rest/auth/roles';
import { RiskCommandService } from '../../application/internal/command-services/risk-command.service';
import { RiskQueryService } from '../../application/internal/query-services/risk-query.service';
import { ChangeRiskStatusCommand, ReassessRiskCommand } from '../../domain/model/commands/risk-commands';
import { GetPriorityRisksQuery, GetRiskQuery } from '../../domain/model/queries/risk-queries';
import { RiskLevel } from '../../domain/model/value-objects/risk-score';
import { ChangeRiskStatusResource, PriorityRisksQueryResource, ReassessRiskResource, RiskDetailResource, RiskResource } from './resources/risk.resources';
import { RiskAssembler } from './transform/risk.assembler';

@ApiTags('Risks')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Missing or invalid JWT' })
@UseGuards(JwtAuthGuard)
@Controller('api/v1/risks')
export class RisksController {
  constructor(
    private readonly commands: RiskCommandService,
    private readonly queries: RiskQueryService,
  ) {}

  @Get('priority')
  @ApiOperation({ summary: 'Open risks of the portfolio at or above a severity, most severe first and critical highlighted (US30)' })
  @ApiOkResponse({ type: [RiskResource] })
  async priority(@Query() q: PriorityRisksQueryResource): Promise<RiskResource[]> {
    const { risks, projects } = await this.queries.handleGetPriority(new GetPriorityRisksQuery(q.minLevel ?? RiskLevel.HIGH));
    return risks.map((r) => RiskAssembler.toResource(r, projects.get(r.projectId)?.name));
  }

  @Get(':riskId')
  @ApiOperation({ summary: 'Get a risk with the history of its evaluations' })
  @ApiOkResponse({ type: RiskDetailResource })
  @ApiResponse({ status: 404, description: 'Risk not found' })
  async get(@Param('riskId', ParseUUIDPipe) riskId: string): Promise<RiskDetailResource> {
    return RiskAssembler.toDetail(await this.queries.handleGet(new GetRiskQuery(riskId)));
  }

  @Post(':riskId/assessments')
  @HttpCode(200)
  @ApiOperation({ summary: 'Re-evaluate probability and impact of a risk; the history is kept (US29)' })
  @ApiOkResponse({ type: RiskDetailResource })
  @ApiResponse({ status: 404, description: 'Risk not found' })
  @ApiResponse({ status: 422, description: 'Closed risk' })
  async reassess(
    @Param('riskId', ParseUUIDPipe) riskId: string,
    @Body() body: ReassessRiskResource,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<RiskDetailResource> {
    ensureRole(user, RISK_MANAGERS);
    return RiskAssembler.toDetail(await this.commands.handleReassess(new ReassessRiskCommand(riskId, body.probability, body.impact, body.note, user.id)));
  }

  @Patch(':riskId/status')
  @ApiOperation({ summary: 'Move a risk through its life cycle (IDENTIFIED, MITIGATING, MITIGATED, OCCURRED, CLOSED) (US29)' })
  @ApiOkResponse({ type: RiskDetailResource })
  @ApiResponse({ status: 404, description: 'Risk not found' })
  @ApiResponse({ status: 422, description: 'Invalid transition or missing mitigation plan' })
  async changeStatus(
    @Param('riskId', ParseUUIDPipe) riskId: string,
    @Body() body: ChangeRiskStatusResource,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<RiskDetailResource> {
    ensureRole(user, RISK_MANAGERS);
    return RiskAssembler.toDetail(await this.commands.handleChangeStatus(new ChangeRiskStatusCommand(riskId, body.status, body.mitigationPlan)));
  }
}
