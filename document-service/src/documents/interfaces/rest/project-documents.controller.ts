import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DomainError } from '../../../shared/domain/domain-error';
import { AuthenticatedUser, CurrentUser } from '../../../shared/interfaces/rest/auth/authenticated-user';
import { JwtAuthGuard } from '../../../shared/interfaces/rest/auth/jwt-auth.guard';
import { DocumentCommandService } from '../../application/internal/command-services/document-command.service';
import { DocumentQueryService } from '../../application/internal/query-services/document-query.service';
import { UploadDocumentCommand } from '../../domain/model/commands/document-commands';
import { GetProjectDocumentsQuery } from '../../domain/model/queries/document-queries';
import { FileContent } from '../../domain/model/value-objects/file-content';
import { DocumentFilterResource, DocumentResource, UploadDocumentFormResource, UploadDocumentResource, UploadResultResource } from './resources/document.resources';
import { DocumentAssembler } from './transform/document.assembler';

@ApiTags('Documents')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Missing or invalid JWT' })
@UseGuards(JwtAuthGuard)
@Controller('api/v1/projects/:projectId/documents')
export class ProjectDocumentsController {
  constructor(
    private readonly commands: DocumentCommandService,
    private readonly queries: DocumentQueryService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: FileContent.MAX_BYTES + 1 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadDocumentFormResource })
  @ApiOperation({ summary: 'Upload a document (multipart) to a project, task or milestone; same name creates a new version (US45, US05, US35)' })
  @ApiCreatedResponse({ type: UploadResultResource })
  @ApiResponse({ status: 404, description: 'Project, milestone or requirement not found' })
  @ApiResponse({ status: 409, description: 'Same content as the latest version (duplicate-document-content)' })
  @ApiResponse({ status: 422, description: 'Empty file, file over 5 MB or type not allowed' })
  async upload(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: UploadDocumentResource,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UploadResultResource> {
    if (!file) throw new DomainError("The multipart field 'file' is required.", 'file-required');
    const content = FileContent.of(Buffer.from(file.originalname, 'latin1').toString('utf8'), file.mimetype, file.buffer);
    const result = await this.commands.handleUpload(
      new UploadDocumentCommand(projectId, content, user.id, body.name, body.taskId, body.milestoneId, body.requirementId),
    );
    return DocumentAssembler.toUploadResult(result);
  }

  @Get()
  @ApiOperation({ summary: 'List the documents of a project, optionally of one task or milestone' })
  @ApiOkResponse({ type: [DocumentResource] })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async list(@Param('projectId', ParseUUIDPipe) projectId: string, @Query() q: DocumentFilterResource): Promise<DocumentResource[]> {
    const documents = await this.queries.handleGetByProject(new GetProjectDocumentsQuery(projectId, q.taskId, q.milestoneId));
    return documents.map(DocumentAssembler.toResource);
  }
}
