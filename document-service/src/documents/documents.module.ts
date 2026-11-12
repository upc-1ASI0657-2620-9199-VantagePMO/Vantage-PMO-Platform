import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentCommandService } from './application/internal/command-services/document-command.service';
import { ReferenceSyncHandler } from './application/internal/event-handlers/reference-sync.handler';
import { FileStorage } from './application/internal/outbound-services/file-storage';
import { DocumentQueryService } from './application/internal/query-services/document-query.service';
import { DocumentRequirementRepository } from './domain/repositories/document-requirement.repository';
import { DocumentRepository } from './domain/repositories/document.repository';
import { ProjectReferenceRepository } from './domain/repositories/project-reference.repository';
import { DocumentRequirementOrmEntity } from './infrastructure/persistence/typeorm/entities/document-requirement.orm-entity';
import { DocumentOrmEntity, DocumentVersionOrmEntity } from './infrastructure/persistence/typeorm/entities/document.orm-entity';
import { FileBlobOrmEntity, MilestoneReferenceOrmEntity, ProjectReferenceOrmEntity } from './infrastructure/persistence/typeorm/entities/reference.orm-entity';
import { TypeOrmDocumentRequirementRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-document-requirement.repository';
import { TypeOrmDocumentRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-document.repository';
import { TypeOrmProjectReferenceRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-project-reference.repository';
import { PostgresFileStorage } from './infrastructure/storage/postgres-file-storage';
import { DocumentRequirementsController } from './interfaces/rest/document-requirements.controller';
import { DocumentsController } from './interfaces/rest/documents.controller';
import { ProjectDocumentsController } from './interfaces/rest/project-documents.controller';

/** Document Management bounded context wiring (ports -> adapters). */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      DocumentOrmEntity, DocumentVersionOrmEntity, DocumentRequirementOrmEntity, ProjectReferenceOrmEntity, MilestoneReferenceOrmEntity, FileBlobOrmEntity,
    ]),
  ],
  controllers: [ProjectDocumentsController, DocumentsController, DocumentRequirementsController],
  providers: [
    DocumentCommandService,
    DocumentQueryService,
    ReferenceSyncHandler,
    { provide: DocumentRepository, useClass: TypeOrmDocumentRepository },
    { provide: DocumentRequirementRepository, useClass: TypeOrmDocumentRequirementRepository },
    { provide: ProjectReferenceRepository, useClass: TypeOrmProjectReferenceRepository },
    { provide: FileStorage, useClass: PostgresFileStorage },
  ],
})
export class DocumentsModule {}
