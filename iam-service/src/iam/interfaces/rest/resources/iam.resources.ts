import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Role } from '../../../domain/model/value-objects/role';

export class SignUpResource {
  @ApiProperty({ example: 'Renzo Araos', maxLength: 120 })
  @IsString() @IsNotEmpty() @MaxLength(120)
  fullName: string;

  @ApiProperty({ example: 'renzo.araos@vantagepmo.pe' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Vantage2026', minLength: 8, description: 'At least 8 characters including letters and numbers' })
  @IsString() @MinLength(8)
  password: string;

  @ApiPropertyOptional({ enum: [Role.PMO_LEAD, Role.PROJECT_MANAGER, Role.MEMBER], default: Role.MEMBER })
  @IsOptional() @IsEnum(Role)
  role?: Role;
}

export class SignInResource {
  @ApiProperty({ example: 'renzo.araos@vantagepmo.pe' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Vantage2026' })
  @IsString() @IsNotEmpty()
  password: string;
}

export class UserResource {
  @ApiProperty() id: string;
  @ApiProperty() fullName: string;
  @ApiProperty() email: string;
  @ApiProperty({ enum: Role }) role: Role;
  @ApiProperty() createdAt: string;
}

export class AuthenticatedUserResource {
  @ApiProperty() id: string;
  @ApiProperty() fullName: string;
  @ApiProperty() email: string;
  @ApiProperty({ enum: Role }) role: Role;
  @ApiProperty({ description: 'Signed JWT to send as "Authorization: Bearer <token>"' }) token: string;
  @ApiProperty({ example: 3600, description: 'Token lifetime in seconds' }) expiresIn: number;
}
