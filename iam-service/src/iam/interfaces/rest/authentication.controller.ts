import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserCommandService } from '../../application/internal/command-services/user-command.service';
import { SignInCommand, SignUpCommand } from '../../domain/model/commands/iam-commands';
import { Role } from '../../domain/model/value-objects/role';
import { AuthenticatedUserResource, SignInResource, SignUpResource, UserResource } from './resources/iam.resources';
import { UserResourceAssembler } from './transform/user-resource.assembler';

@ApiTags('Authentication')
@Controller('api/v1/authentication')
export class AuthenticationController {
  constructor(private readonly commands: UserCommandService) {}

  @Post('sign-up')
  @ApiOperation({ summary: 'Register a new user; the password is stored as a BCrypt hash (US51)' })
  @ApiCreatedResponse({ type: UserResource })
  @ApiResponse({ status: 409, description: 'E-mail already registered' })
  @ApiResponse({ status: 422, description: 'Weak password or role not allowed' })
  async signUp(@Body() body: SignUpResource): Promise<UserResource> {
    const user = await this.commands.handleSignUp(new SignUpCommand(body.fullName, body.email, body.password, body.role ?? Role.MEMBER));
    return UserResourceAssembler.toResource(user);
  }

  @Post('sign-in')
  @HttpCode(200)
  @ApiOperation({ summary: 'Authenticate with e-mail and password and obtain a JWT (US20, US41)' })
  @ApiOkResponse({ type: AuthenticatedUserResource })
  @ApiResponse({ status: 401, description: 'Invalid e-mail or password' })
  async signIn(@Body() body: SignInResource): Promise<AuthenticatedUserResource> {
    const { user, token } = await this.commands.handleSignIn(new SignInCommand(body.email, body.password));
    return UserResourceAssembler.toAuthenticatedResource(user, token);
  }
}
