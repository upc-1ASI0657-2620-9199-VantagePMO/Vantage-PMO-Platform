import { Controller, Get, Param, ParseUUIDPipe, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiProduces, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../../shared/interfaces/rest/auth/jwt-auth.guard';
import { DocumentQueryService } from '../../application/internal/query-services/document-query.service';
import { GetDocumentContentQuery, GetDocumentQuery } from '../../domain/model/queries/document-queries';
import { DocumentResource, DownloadQueryResource } from './resources/document.resources';
import { DocumentAssembler } from './transform/document.assembler';

@ApiTags('Documents')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Missing or invalid JWT' })
@UseGuards(JwtAuthGuard)
@Controller('api/v1/documents')
export class DocumentsController {
  constructor(private readonly queries: DocumentQueryService) {}

  @Get(':documentId')
  @ApiOperation({ summary: 'Get a document with its version history (US35)' })
  @ApiOkResponse({ type: DocumentResource })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async get(@Param('documentId', ParseUUIDPipe) documentId: string): Promise<DocumentResource> {
    return DocumentAssembler.toResource(await this.queries.handleGet(new GetDocumentQuery(documentId)));
  }

  @Get(':documentId/content')
  @ApiProduces('application/octet-stream')
  @ApiOperation({ summary: 'Download the latest or a specific version of a document (US05, US45)' })
  @ApiOkResponse({ description: 'Binary content with Content-Disposition attachment' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @ApiResponse({ status: 422, description: 'Version does not exist' })
  async download(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Query() q: DownloadQueryResource,
    @Res() res: Response,
  ): Promise<void> {
    const { version, data } = await this.queries.handleGetContent(new GetDocumentContentQuery(documentId, q.version));
    res.setHeader('Content-Type', version.contentType);
    res.setHeader('Content-Length', String(data.length));
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(version.fileName)}`);
    res.setHeader('X-Document-Version', String(version.number));
    res.send(data);
  }
}
