import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { types } from 'pg';
import { HealthController } from './shared/interfaces/rest/health.controller';
import { ProjectsModule } from './projects/projects.module';

// Return PostgreSQL DATE columns as plain 'YYYY-MM-DD' strings (no timezone shift).
types.setTypeParser(1082, (value: string) => value);

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.getOrThrow<string>('DATABASE_URL'),
        schema: config.get<string>('DB_SCHEMA') || undefined,
        autoLoadEntities: true,
        synchronize: config.get('DB_SYNCHRONIZE', 'true') === 'true',
        ssl: config.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
      }),
    }),
    ProjectsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
