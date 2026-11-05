import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AllocationCommandService } from './application/internal/command-services/allocation-command.service';
import { ReplicaSyncHandler } from './application/internal/event-handlers/replica-sync.handler';
import { ResourceQueryService } from './application/internal/query-services/resource-query.service';
import { AllocationRepository } from './domain/repositories/allocation.repository';
import { MemberRepository } from './domain/repositories/member.repository';
import { ProjectReferenceRepository } from './domain/repositories/project-reference.repository';
import { AllocationOrmEntity } from './infrastructure/persistence/typeorm/entities/allocation.orm-entity';
import { MemberOrmEntity } from './infrastructure/persistence/typeorm/entities/member.orm-entity';
import { ProjectReferenceOrmEntity } from './infrastructure/persistence/typeorm/entities/project-reference.orm-entity';
import { TypeOrmAllocationRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-allocation.repository';
import { TypeOrmMemberRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-member.repository';
import { TypeOrmProjectReferenceRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-project-reference.repository';
import { AllocationsController } from './interfaces/rest/allocations.controller';
import { ProjectAllocationsController } from './interfaces/rest/project-allocations.controller';
import { ResourcesController } from './interfaces/rest/resources.controller';

/** Resource Management bounded context wiring (ports -> adapters). */
@Module({
  imports: [TypeOrmModule.forFeature([AllocationOrmEntity, MemberOrmEntity, ProjectReferenceOrmEntity])],
  controllers: [ProjectAllocationsController, AllocationsController, ResourcesController],
  providers: [
    AllocationCommandService,
    ResourceQueryService,
    ReplicaSyncHandler,
    { provide: AllocationRepository, useClass: TypeOrmAllocationRepository },
    { provide: MemberRepository, useClass: TypeOrmMemberRepository },
    { provide: ProjectReferenceRepository, useClass: TypeOrmProjectReferenceRepository },
  ],
})
export class ResourcesModule {}
