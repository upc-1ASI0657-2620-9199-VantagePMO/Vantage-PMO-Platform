import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

@ApiExcludeController()
@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  async check() {
    await this.dataSource.query('SELECT 1');
    return { service: 'iam-service', status: 'UP', database: 'UP', timestamp: new Date().toISOString() };
  }
}
