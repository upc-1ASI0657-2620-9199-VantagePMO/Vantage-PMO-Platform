import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { HashingService } from '../../application/internal/outbound-services/hashing.service';

@Injectable()
export class BcryptHashingService extends HashingService {
  private static readonly COST = 10;

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, BcryptHashingService.COST);
  }

  verify(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain ?? '', hash);
  }
}
