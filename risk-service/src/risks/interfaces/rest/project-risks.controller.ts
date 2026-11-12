import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser, CurrentUser } from '../../../shared/interfaces/rest/auth/authenticated-user';
import { JwtAuthGuard } from '../../../shared/interfaces/rest/auth/jwt-auth.guard';
import { ensureRole, RISK_MANAGERS } from '../../../shared/interfaces/rest/auth/roles';
import { RiskCommandService } from '../../application/internal/command-services/risk-command.service';
import { RiskQueryService } from '../../application/internal/query-services/risk-query.service';
import { RegisterRiskCommand } from '../../domain/model/commands/risk-commands';
import { GetProjectRisksQuery } from '../../domain/model/queries/risk-queries';
import { CreateRiskResource, ProjectRisksQueryResource, RiskDetailResource, RiskResource } from './resources/risk.resources';
import { RiskAssembler } from './transform/risk.assembler';

@ApiTags('Risks')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Missing or invalid JWT' })
@UseGuards(JwtAuthGuard)
@Controller('api/v1/projects/:projectId/risks')
export class ProjectRisksController {
  constructor(
    private readonly commands: RiskCommandService,
    private readonly queries: RiskQueryService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Register a project risk; its severity is calculated as probability x impact (US28)' })
  @ApiCreatedResponse({ type: RiskDetailResource })
  @ApiResponse({ status: 403, description: 'Only ADMIN, PMO_LEAD or PROJECT_MANAGER' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 422, description: 'Project closed' })
  async register(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() body: CreateRiskResource,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<RiskDetailResource> {
    ensureRole(user, RISK_MANAGERS);
    const risk = await this.commands.handleRegister(new RegisterRiskCommand(
      projectId, body.title, body.description, body.category, body.probability, body.impact, body.responsibleId, body.mitigationPlan, user.id,
    ));
    return RiskAssembler.toDetail(risk);
  }

  @Get()
  @ApiOperation({ summary: 'Risk register of a project ordered by severity, critical first (US55)' })
  @ApiOkResponse({ type: [RiskResource] })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async list(@Param('projectId', ParseUUIDPipe) projectId: string, @Query() q: ProjectRisksQueryResource): Promise<RiskResource[]> {
    const risks = await this.queries.handleGetByProject(new GetProjectRisksQuery(projectId, q.status, q.minLevel));
    return risks.map((r) => RiskAssembler.toResource(r));
  }
}
