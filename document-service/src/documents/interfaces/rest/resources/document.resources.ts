import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

/** HTML forms and Swagger UI send optional multipart fields as empty strings: treat them as absent. */
const emptyAsUndefined = () => Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value));

/** Text fields of the multipart upload (validated). The binary arrives through @UploadedFile. */
export class UploadDocumentResource {
  @ApiPropertyOptional({ example: 'Acta de aceptación', description: 'Logical name; uploading again with the same name creates a new version (US35). Defaults to the requirement name or the file name.' })
  @emptyAsUndefined()
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Attach the document to a task (US05)' })
  @emptyAsUndefined()
  @IsOptional() @IsUUID()
  taskId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Attach the document to a milestone' })
  @emptyAsUndefined()
  @IsOptional() @IsUUID()
  milestoneId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Mandatory document that this upload fulfills (US21)' })
  @emptyAsUndefined()
  @IsOptional() @IsUUID()
  requirementId?: string;
}

/** Swagger description of the whole multipart body (file + fields). */
export class UploadDocumentFormResource extends UploadDocumentResource {
  @ApiProperty({ type: 'string', format: 'binary', description: 'File (PDF, Office, image, text, CSV or ZIP; max 5 MB)' })
  file: unknown;
}

export class DocumentVersionResource {
  @ApiProperty({ example: 2 }) number: number;
  @ApiProperty({ example: 'acta-aceptacion-v2.pdf' }) fileName: string;
  @ApiProperty({ example: 'application/pdf' }) contentType: string;
  @ApiProperty({ example: 48211 }) sizeBytes: number;
  @ApiProperty({ example: '9f2c…', description: 'SHA-256 of the content' }) checksum: string;
  @ApiProperty({ format: 'uuid' }) uploadedBy: string;
  @ApiProperty({ example: '2026-11-12T15:04:11.000Z' }) uploadedAt: string;
  @ApiProperty({ example: '/api/v1/documents/7c1e…/content?version=2' }) downloadUrl: string;
}

export class DocumentResource {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) projectId: string;
  @ApiProperty({ example: 'Acta de aceptación' }) name: string;
  @ApiPropertyOptional({ format: 'uuid', nullable: true }) taskId: string | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true }) milestoneId: string | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true }) requirementId: string | null;
  @ApiProperty({ example: 2 }) latestVersion: number;
  @ApiProperty({ example: '/api/v1/documents/7c1e…/content', description: 'Access URL of the latest version (US45)' }) downloadUrl: string;
  @ApiProperty({ type: [DocumentVersionResource] }) versions: DocumentVersionResource[];
}

export class UploadResultResource extends DocumentResource {
  @ApiProperty({ example: false, description: 'false when the upload added a new version to an existing document' }) createdNewDocument: boolean;
  @ApiPropertyOptional({ format: 'uuid', nullable: true, description: 'Mandatory document fulfilled by this upload' }) fulfilledRequirementId: string | null;
}

export class DocumentFilterResource {
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() taskId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() milestoneId?: string;
}

export class DownloadQueryResource {
  @ApiPropertyOptional({ example: 1, description: 'Version to download (default: latest)' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  version?: number;
}

export class CreateRequirementResource {
  @ApiProperty({ example: 'Acta de aceptación del cliente', maxLength: 150 })
  @IsString() @IsNotEmpty() @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ example: 'Firmada por el sponsor del proyecto', maxLength: 300 })
  @IsOptional() @IsString() @MaxLength(300)
  description?: string;
}

export class RequirementResource {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) projectId: string;
  @ApiProperty({ format: 'uuid' }) milestoneId: string;
  @ApiProperty({ example: 'Acta de aceptación del cliente' }) name: string;
  @ApiPropertyOptional({ example: 'Firmada por el sponsor del proyecto', nullable: true }) description: string | null;
  @ApiProperty({ example: false }) fulfilled: boolean;
  @ApiPropertyOptional({ format: 'uuid', nullable: true }) documentId: string | null;
}

export class MilestoneRequirementsResource {
  @ApiProperty({ format: 'uuid' }) milestoneId: string;
  @ApiProperty({ example: false, description: 'true when every mandatory document was uploaded (the milestone can be closed)' }) readyToClose: boolean;
  @ApiProperty({ example: ['Acta de aceptación del cliente'] }) missing: string[];
  @ApiProperty({ type: [RequirementResource] }) requirements: RequirementResource[];
}
