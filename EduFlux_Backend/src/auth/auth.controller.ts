import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  BadRequestException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  CheckUserInput,
  LoginInput,
  LoginOutput,
  RegisterInput,
  RegisterOutput,
  ResetPasswordInput,
  TokenOutput,
  VerifyOtpInput,
} from './dto';
import { UserService } from 'src/user/user.service';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiProperty,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { GoogleOAuthGuard } from './guards/google-oauth.guards';
import { UpdatePasswordInput } from './dto/update-password.input';
import { AtGuard } from './decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a user' })
  @ApiCreatedResponse({
    description: 'User created Successfully',
    type: RegisterOutput,
  })
  @ApiBadRequestResponse({ description: 'User already exists' })
  async register(@Body() registerInput: RegisterInput) {
    const { email } = registerInput;
    const existingUser = await this.userService.getUser({ email: email });
    if (existingUser) {
      throw new BadRequestException(
        `User with email: ${email} already exists!`,
      );
    }
    return await this.userService.createUser(registerInput);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login a user' })
  @ApiCreatedResponse({
    description: 'User logged in Successfully',
    type: LoginOutput,
  })
  @ApiBadRequestResponse({ description: 'Invalid credentials' })
  async login(@Body() loginInput: LoginInput): Promise<LoginOutput> {
    const { email, password } = loginInput;
    const user = await this.authService.validateUser(email, password);
    return await this.authService.generateTokens(user);
  }
  @UseGuards(GoogleOAuthGuard)
  @Get('google/login')
  async googleLogin() {
    // Guard redirects to Google OAuth2 login page
  }

  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  async googleLoginCallback(@Req() req: any) {
    if (!req.user) {
      throw new BadRequestException('Google authentication failed');
    }
    const response = await this.authService.generateTokens(req.user);
    return response;
  }

  @AtGuard()
  @ApiBearerAuth('JWT-auth')
  @Patch('change-password')
  @ApiOperation({ summary: 'Update user password' })
  @ApiCreatedResponse({
    description: 'Password updated successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid credentials or password mismatch',
  })
  async updatePassword(
    @Body() updatePasswordInput: UpdatePasswordInput,
    @Req() req: any,
  ) {
    const { currentPassword, newPassword, confirmNewPassword } =
      updatePasswordInput;
    const userId = req.user._id.toString();
    await this.authService.updatePassword(
      userId,
      currentPassword,
      newPassword,
      confirmNewPassword,
    );
    return { message: 'Password updated successfully' };
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Forgot password' })
  @ApiCreatedResponse({
    description: 'Password reset link sent successfully',
    example: { message: 'OTP has been sent' },
  })
  @ApiBadRequestResponse({
    description: 'User with the provided email does not exist',
  })
  async forgotPassword(@Body() checkUserInput: CheckUserInput) {
    await this.authService.forgotPassword(checkUserInput.email);
    return { message: 'OTP has been sent' };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password' })
  @ApiCreatedResponse({
    description: 'Password has been reset successfully',
    example: { message: 'Password has been reset successfully' },
  })
  @ApiBadRequestResponse({
    description: 'Invalid token or email',
  })
  async resetPassword(@Body() resetPasswordInput: ResetPasswordInput) {
    await this.authService.resetPassword(resetPasswordInput);
    return { message: 'Password has been reset successfully' };
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP' })
  @ApiCreatedResponse({
    description: 'OTP verified successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid OTP',
  })
  async verifyOtp(@Body() verifyOtpInput: VerifyOtpInput) {
    const { email, token, authTokenType } = verifyOtpInput;
    await this.authService.verifyOtp(email, token, authTokenType);
    return { message: 'OTP verified successfully' };
  }
}
