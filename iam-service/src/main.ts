import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ProblemDetailsFilter } from './shared/interfaces/rest/problem-details.filter';
import { ensureSchema } from './shared/infrastructure/persistence/ensure-schema';

async function bootstrap() {
  await ensureSchema();
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new ProblemDetailsFilter());

  const config = new DocumentBuilder()
    .setTitle('Vantage PMO - IAM Service')
    .setDescription('Identity & Access Management: user registration, authentication and JWT issuing.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('swagger', app, SwaggerModule.createDocument(app, config), { jsonDocumentUrl: 'swagger/json' });

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  Logger.log(`IAM Service listening on port ${port}`, 'Bootstrap');
}
bootstrap();
