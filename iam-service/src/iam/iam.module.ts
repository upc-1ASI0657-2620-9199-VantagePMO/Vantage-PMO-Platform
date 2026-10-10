import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserCommandService } from './application/internal/command-services/user-command.service';
import { HashingService } from './application/internal/outbound-services/hashing.service';
import { TokenService } from './application/internal/outbound-services/token.service';
import { UserQueryService } from './application/internal/query-services/user-query.service';
import { UserRepository } from './domain/repositories/user.repository';
import { BcryptHashingService } from './infrastructure/hashing/bcrypt-hashing.service';
import { UserOrmEntity } from './infrastructure/persistence/typeorm/entities/user.orm-entity';
import { TypeOrmUserRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-user.repository';
import { JwtTokenService } from './infrastructure/tokens/jwt-token.service';
import { AuthenticationController } from './interfaces/rest/authentication.controller';
import { UsersController } from './interfaces/rest/users.controller';

/** Identity & Access Management bounded context wiring. */
@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity])],
  controllers: [AuthenticationController, UsersController],
  providers: [
    UserCommandService,
    UserQueryService,
    { provide: UserRepository, useClass: TypeOrmUserRepository },
    { provide: HashingService, useClass: BcryptHashingService },
    { provide: TokenService, useClass: JwtTokenService },
  ],
})
export class IamModule {}
