import { createHash } from 'crypto';
import { DomainError } from '../../../../shared/domain/domain-error';

/** Value Object: an uploaded binary with its metadata and SHA-256 fingerprint. */
export class FileContent {
  static readonly MAX_BYTES = 5 * 1024 * 1024;
  static readonly ALLOWED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.ms-excel',
    'image/png',
    'image/jpeg',
    'text/plain',
    'text/csv',
    'application/zip',
  ];

  private constructor(
    public readonly fileName: string,
    public readonly contentType: string,
    public readonly data: Buffer,
    public readonly checksum: string,
  ) {}

  static of(fileName: string, contentType: string, data: Buffer): FileContent {
    if (!data || data.length === 0) throw new DomainError('The file is empty.', 'empty-file');
    if (data.length > FileContent.MAX_BYTES) throw new DomainError('The file exceeds the 5 MB limit.', 'file-too-large');
    const type = (contentType || '').split(';')[0].trim().toLowerCase();
    if (!FileContent.ALLOWED_TYPES.includes(type)) throw new DomainError(`Files of type '${type || 'unknown'}' are not allowed.`, 'file-type-not-allowed');
    const name = (fileName || '').trim();
    if (!name) throw new DomainError('The file name is required.', 'file-name-required');
    return new FileContent(name.substring(0, 200), type, data, createHash('sha256').update(data).digest('hex'));
  }

  get size(): number {
    return this.data.length;
  }
}
