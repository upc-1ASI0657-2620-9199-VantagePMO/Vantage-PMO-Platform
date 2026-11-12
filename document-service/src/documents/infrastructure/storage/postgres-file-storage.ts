import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundError } from '../../../shared/domain/domain-error';
import { FileStorage } from '../../application/internal/outbound-services/file-storage';
import { FileBlobOrmEntity } from '../persistence/typeorm/entities/reference.orm-entity';

/** FileStorage adapter that keeps the binaries in a bytea table of the service schema. */
@Injectable()
export class PostgresFileStorage extends FileStorage {
  constructor(@InjectRepository(FileBlobOrmEntity) private readonly blobs: Repository<FileBlobOrmEntity>) {
    super();
  }

  async put(key: string, data: Buffer, contentType: string): Promise<void> {
    await this.blobs.save({ storageKey: key, data, contentType });
  }

  async get(key: string): Promise<Buffer> {
    const blob = await this.blobs.findOne({ where: { storageKey: key } });
    if (!blob) throw new ResourceNotFoundError('File', key);
    return blob.data;
  }
}
