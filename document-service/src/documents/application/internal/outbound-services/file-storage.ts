/**
 * Output port for binary storage. The Sprint 3 adapter keeps the files in the service's own
 * PostgreSQL schema (Render free tier has no persistent disk); an object storage adapter
 * (S3, Azure Blob) can replace it without touching the domain.
 */
export abstract class FileStorage {
  abstract put(key: string, data: Buffer, contentType: string): Promise<void>;
  abstract get(key: string): Promise<Buffer>;
}
