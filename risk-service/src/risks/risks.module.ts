import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RiskCommandService } from './application/internal/command-services/risk-command.service';
import { ProjectSyncHandler } from './application/internal/event-handlers/project-sync.handler';
import { RiskQueryService } from './application/internal/query-services/risk-query.service';
import { ProjectReferenceRepository } from './domain/repositories/project-reference.repository';
import { RiskRepository } from './domain/repositories/risk.repository';
import { ProjectReferenceOrmEntity, RiskAssessmentOrmEntity, RiskOrmEntity } from './infrastructure/persistence/typeorm/entities/risk.orm-entity';
import { TypeOrmProjectReferenceRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-project-reference.repository';
import { TypeOrmRiskRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-risk.repository';
import { ProjectRisksController } from './interfaces/rest/project-risks.controller';
import { RisksController } from './interfaces/rest/risks.controller';

/** Risk Management bounded context wiring (ports -> adapters). */
@Module({
  imports: [TypeOrmModule.forFeature([RiskOrmEntity, RiskAssessmentOrmEntity, ProjectReferenceOrmEntity])],
  controllers: [ProjectRisksController, RisksController],
  providers: [
    RiskCommandService,
    RiskQueryService,
    ProjectSyncHandler,
    { provide: RiskRepository, useClass: TypeOrmRiskRepository },
    { provide: ProjectReferenceRepository, useClass: TypeOrmProjectReferenceRepository },
  ],
})
export class RisksModule {}
