import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectCommandService } from './application/internal/command-services/project-command.service';
import { TaskCommandService } from './application/internal/command-services/task-command.service';
import { ProjectQueryService } from './application/internal/query-services/project-query.service';
import { ProjectRepository } from './domain/repositories/project.repository';
import { ProjectSummaryReader } from './domain/repositories/project-summary.reader';
import { TaskRepository } from './domain/repositories/task.repository';
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
  imports: [TypeOrmModule.forFeature([ProjectOrmEntity, MilestoneOrmEntity, TaskOrmEntity])],
  controllers: [ProjectsController, TasksController],
  providers: [
    ProjectCommandService,
    TaskCommandService,
    ProjectQueryService,
    { provide: ProjectRepository, useClass: TypeOrmProjectRepository },
    { provide: TaskRepository, useClass: TypeOrmTaskRepository },
    { provide: ProjectSummaryReader, useClass: TypeOrmProjectSummaryReader },
  ],
})
export class ProjectsModule {}
