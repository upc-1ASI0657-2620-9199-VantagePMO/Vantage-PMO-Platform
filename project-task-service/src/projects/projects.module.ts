import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectCommandService } from './application/internal/command-services/project-command.service';
import { TaskCommandService } from './application/internal/command-services/task-command.service';
import { ProjectAlertScanService } from './application/internal/scheduled/project-alert-scan.service';
import { ProjectSnapshotReplayService } from './application/internal/scheduled/project-snapshot-replay.service';
import { ProjectQueryService } from './application/internal/query-services/project-query.service';
import { ProjectRepository } from './domain/repositories/project.repository';
import { ProjectSummaryReader } from './domain/repositories/project-summary.reader';
import { TaskRepository } from './domain/repositories/task.repository';
import { MilestoneDocumentRequirementRepository } from './domain/repositories/milestone-document-requirement.repository';
import { TypeOrmMilestoneDocumentRequirementRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-milestone-document-requirement.repository';
import { MilestoneDocumentRequirementOrmEntity } from './infrastructure/persistence/typeorm/entities/milestone-document-requirement.orm-entity';
import { DocumentRequirementSyncHandler } from './application/internal/event-handlers/document-requirement-sync.handler';
import { ProjectAlertReader } from './domain/repositories/project-alert.reader';
import { TypeOrmProjectAlertReader } from './infrastructure/persistence/typeorm/repositories/typeorm-project-alert.reader';
import { AlertsController } from './interfaces/rest/alerts.controller';
import { MilestoneOrmEntity } from './infrastructure/persistence/typeorm/entities/milestone.orm-entity';
import { ProjectOrmEntity } from './infrastructure/persistence/typeorm/entities/project.orm-entity';
import { TaskOrmEntity } from './infrastructure/persistence/typeorm/entities/task.orm-entity';
import { TypeOrmProjectSummaryReader } from './infrastructure/persistence/typeorm/repositories/typeorm-project-summary.reader';
import { TypeOrmProjectRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-project.repository';
import { TypeOrmTaskRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-task.repository';
import { ProjectsController } from './interfaces/rest/projects.controller';
import { TasksController } from './interfaces/rest/tasks.controller';

/** Project & Task Management bounded context wiring (ports -> adapters). */
@Module({
  imports: [TypeOrmModule.forFeature([ProjectOrmEntity, MilestoneOrmEntity, TaskOrmEntity, MilestoneDocumentRequirementOrmEntity])],
  controllers: [ProjectsController, TasksController, AlertsController],
  providers: [
    ProjectCommandService,
    TaskCommandService,
    ProjectQueryService,
    ProjectAlertScanService,
    ProjectSnapshotReplayService,
    { provide: ProjectRepository, useClass: TypeOrmProjectRepository },
    { provide: TaskRepository, useClass: TypeOrmTaskRepository },
    { provide: ProjectSummaryReader, useClass: TypeOrmProjectSummaryReader },
    { provide: ProjectAlertReader, useClass: TypeOrmProjectAlertReader },
    { provide: MilestoneDocumentRequirementRepository, useClass: TypeOrmMilestoneDocumentRequirementRepository },
    DocumentRequirementSyncHandler,
  ],
})
export class ProjectsModule {}
