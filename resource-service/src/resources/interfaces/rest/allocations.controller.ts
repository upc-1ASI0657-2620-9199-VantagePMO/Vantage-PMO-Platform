import { Body, Controller, Delete, HttpCode, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser, CurrentUser } from '../../../shared/interfaces/rest/auth/authenticated-user';
import { JwtAuthGuard } from '../../../shared/interfaces/rest/auth/jwt-auth.guard';
import { ensureRole, RESOURCE_MANAGERS } from '../../../shared/interfaces/rest/auth/roles';
import { AllocationCommandService } from '../../application/internal/command-services/allocation-command.service';
import { ChangeAllocationCommand, ReleaseAllocationCommand } from '../../domain/model/commands/resource-commands';
import { AllocationResultResource, UpdateAllocationResource } from './resources/allocation.resources';
import { AllocationAssembler } from './transform/allocation.assembler';

@ApiTags('Allocations')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Missing or invalid JWT' })
@UseGuards(JwtAuthGuard)
@Controller('api/v1/allocations')
export class AllocationsController {
  constructor(private readonly commands: AllocationCommandService) {}

  @Patch(':allocationId')
  @ApiOperation({ summary: 'Change the role, share or period of an allocation' })
  @ApiOkResponse({ type: AllocationResultResource })
  @ApiResponse({ status: 404, description: 'Allocation not found' })
  async change(
    @Param('allocationId', ParseUUIDPipe) allocationId: string,
    @Body() body: UpdateAllocationResource,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AllocationResultResource> {
    ensureRole(user, RESOURCE_MANAGERS);
    const result = await this.commands.handleChange(
      new ChangeAllocationCommand(allocationId, body.role, body.percentage, body.startDate, body.endDate),
    );
    return AllocationAssembler.toResult(result);
  }

  @Delete(':allocationId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Release a member from a project' })
  @ApiNoContentResponse({ description: 'Allocation removed' })
  @ApiResponse({ status: 404, description: 'Allocation not found' })
  async release(@Param('allocationId', ParseUUIDPipe) allocationId: string, @CurrentUser() user: AuthenticatedUser): Promise<void> {
    ensureRole(user, RESOURCE_MANAGERS);
    await this.commands.handleRelease(new ReleaseAllocationCommand(allocationId));
  }
}
