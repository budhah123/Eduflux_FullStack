import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from 'src/auth/auth.service';
import { LoginInput, TokenOutput } from 'src/auth/dto';
import { UserService } from 'src/user/user.service';
import { UserType } from 'src/user/enum';

@ApiTags('Admin Auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Admin login' })
  @ApiCreatedResponse({
    description: 'Admin logged in successfully with JWT tokens',
    type: TokenOutput,
  })
  @ApiBadRequestResponse({ description: 'Invalid email or password' })
  async login(@Body() loginInput: LoginInput): Promise<TokenOutput> {
    const { email, password } = loginInput;

    // Validate user credentials
    const user = await this.authService.validateUser(email, password);

    // Check if user is admin
    if (user.userType !== UserType.ADMIN) {
      throw new BadRequestException(
        'Access denied: Only admins can login here',
      );
    }

    // Generate and return tokens
    return await this.authService.generateTokens(user);
  }
}
