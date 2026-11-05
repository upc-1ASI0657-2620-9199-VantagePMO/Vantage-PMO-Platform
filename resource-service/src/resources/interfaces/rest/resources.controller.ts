import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/interfaces/rest/auth/jwt-auth.guard';
import { ResourceQueryService } from '../../application/internal/query-services/resource-query.service';
import { GetResourceAvailabilityQuery } from '../../domain/model/queries/resource-queries';
import { AvailabilityQueryResource, AvailabilityResource } from './resources/allocation.resources';
import { AllocationAssembler } from './transform/allocation.assembler';

@ApiTags('Resources')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Missing or invalid JWT' })
@UseGuards(JwtAuthGuard)
@Controller('api/v1/resources')
export class ResourcesController {
  constructor(private readonly queries: ResourceQueryService) {}

  @Get('availability')
  @ApiOperation({ summary: 'Available capacity of every member in a period, to decide new assignments (US15)' })
  @ApiOkResponse({ type: AvailabilityResource })
  @ApiResponse({ status: 422, description: 'Invalid period' })
  async availability(@Query() q: AvailabilityQueryResource): Promise<AvailabilityResource> {
    const from = q.from ? q.from.substring(0, 10) : new Date().toISOString().substring(0, 10);
    const to = q.to ? q.to.substring(0, 10) : new Date(new Date(from).getTime() + 30 * 86_400_000).toISOString().substring(0, 10);
    const members = await this.queries.handleGetAvailability(new GetResourceAvailabilityQuery(from, to, q.minAvailable ?? 0));
    return { from, to, members: members.map(AllocationAssembler.toAvailability) };
  }
}
