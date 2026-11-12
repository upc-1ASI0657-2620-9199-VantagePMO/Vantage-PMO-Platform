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
  app.enableShutdownHooks();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new ProblemDetailsFilter());

  const config = new DocumentBuilder()
    .setTitle('Vantage PMO - Risk Service')
    .setDescription('Supporting microservice: risk register of the projects, severity (probability x impact) and prioritization.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('swagger', app, SwaggerModule.createDocument(app, config), { jsonDocumentUrl: 'swagger/json' });

  const port = Number(process.env.PORT ?? 3006);
  await app.listen(port);
  Logger.log(`Risk Service listening on port ${port}`, 'Bootstrap');
}
bootstrap();
