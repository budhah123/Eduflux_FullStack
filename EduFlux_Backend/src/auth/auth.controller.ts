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
  Res,
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
import { AtGuard, CurrentUser } from './decorator';
import { AuthType } from './enum/auth-type.enum';
import type { Response } from 'express';

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
    const user = await this.userService.createUser(registerInput);

    await this.authService.generateAuthTokenAndSendVerificationCode(
      user,
      AuthType.EMAIL,
    );
    return user;
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

    if (!user.isVerified) {
      // ← add this check
      throw new BadRequestException(
        'Please verify your email before logging in',
      );
    }
    return await this.authService.generateTokens(user);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email with OTP' })
  async verifyEmail(@Body() dto: VerifyOtpInput) {
    const { email, token } = dto;
    await this.authService.verifyEmail(email, token);
    return { message: 'Email verified successfully' };
  }

  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend email verification OTP' })
  async resendVerification(@Body() dto: CheckUserInput) {
    const user = await this.userService.getUser({ email: dto.email });
    if (!user) throw new BadRequestException('User not found');
    if (user.isVerified) return { message: 'Email already verified' };

    await this.authService.generateAuthTokenAndSendVerificationCode(
      user,
      AuthType.EMAIL,
    );
    return { message: 'Verification code resent' };
  }

  @AtGuard()
  @ApiBearerAuth('JWT-auth')
  @Get('me')
  @ApiOperation({ summary: 'Get the current authenticated user profile' })
  async me(@CurrentUser() user: any) {
    return {
      id: user._id?.toString?.() ?? user._id,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      fullName:
        [user.firstName, user.lastName].filter(Boolean).join(' ') ||
        user.email?.split('@')?.[0] ||
        'User',
      email: user.email,
      userType: user.userType,
      avatarUrl: user.avatarUrl || user.profilePicture || null,
    };
  }

  @UseGuards(GoogleOAuthGuard)
  @Get('google/login')
  async googleLogin() {
    // Guard redirects to Google OAuth2 login page
  }

  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  async googleLoginCallback(@Req() req: any, @Res() res: Response) {
    if (!req.user) {
      throw new BadRequestException('Google authentication failed');
    }
    const tokens = await this.authService.generateTokens(req.user);

    return res.redirect(
      `${process.env.FRONTEND_URL}/auth/google/success?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
    );
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
