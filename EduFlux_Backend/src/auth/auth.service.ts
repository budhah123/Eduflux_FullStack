import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { ResetPasswordInput, TokenOutput } from './dto';
import { JwtConfigService } from './config';
import { UserEntity } from 'src/user/entity';
import { AuthTokenType } from './enum';
import { AuthType } from './enum/auth-type.enum';
import { AuthTokenEntity } from './entity';
import { MongoRepository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { randomInt } from 'crypto';

import { ObjectId } from 'mongodb';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly jwtConfigService: JwtConfigService,
    @InjectRepository(AuthTokenEntity)
    private readonly authTokenRepository: MongoRepository<AuthTokenEntity>,
  ) {}

  private generateNumericOtp(length = 6): string {
    const maxValue = 10 ** length;
    return randomInt(0, maxValue).toString().padStart(length, '0');
  }

  async validateUser(email: string, password: string) {
    const user = await this.userService.getUser({ email: email });
    if (!user) {
      throw new BadRequestException('User not Found');
    }

    if (!user.password) {
      throw new BadRequestException('User password not set');
    }

    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async comparePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    if (!plainPassword || !hashedPassword) {
      throw new BadRequestException(
        'Password and hashed password are required',
      );
    }
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async generateTokens(user: any): Promise<TokenOutput> {
    const payload = {
      email: user.email,
      id: user._id,
      userType: user.userType,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.jwtConfigService.getRefreshTokenSecret(),
      expiresIn: this.jwtConfigService.getRefreshTokenExpiresIn(),
    } as any);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 86400, // 1 day in seconds (24 * 60 * 60)
    };
  }

  async register() {}
  async validateGoogleUser(googleUser: any) {
    const user = await this.userService.getUser({ email: googleUser.email });
    if (user) {
      return user;
    }
    // Create new Google user with isActive set to true
    return await this.userService.createUser({
      ...googleUser,
      isActive: true,
    });
  }

  async updatePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
    confirmNewPassword: string,
  ) {
    const user = await this.userService.getUser({ _id: new ObjectId(userId) });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    //compare the old password with the stored password
    const isOldPasswordValid = await this.comparePassword(
      oldPassword,
      user.password || '',
    );
    if (!isOldPasswordValid) {
      throw new BadRequestException('Old password is incorrect');
    }
    if (newPassword !== confirmNewPassword) {
      throw new BadRequestException(
        'New password and confirm new password do not match',
      );
    }
    const hashedNewPassword = await this.hashPassword(newPassword);
    return await this.userService.updateUser(userId, {
      password: hashedNewPassword,
    });
  }

  async forgotPassword(email: string) {
    const user = await this.userService.getUser({ email: email });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if token already exists for this user
    let authToken = await this.authTokenRepository.findOne({
      where: {
        userId: user._id.toString(),
        type: AuthTokenType.RESET_PASSWORD_VERIFICATION_TOKEN,
      },
    });

    const forgotPasswordCode = this.generateNumericOtp();

    if (!authToken) {
      // Create new token
      authToken = this.authTokenRepository.create({
        userId: user._id.toString(),
        type: AuthTokenType.RESET_PASSWORD_VERIFICATION_TOKEN,
        token: forgotPasswordCode,
      });
    } else {
      // Update existing token with a new code
      authToken.token = forgotPasswordCode;
    }

    await this.authTokenRepository.save(authToken);

    // For development, log the OTP. In production, this would be emailed.
    console.log(`[DEBUG] OTP for ${email}: ${forgotPasswordCode}`);

    return 'Successful';
  }

  async resetPassword(params: ResetPasswordInput) {
    const { email, token, password } = params;
    const user = await this.userService.getUser({ email: email });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // so we must query it as string.
    const authToken = await this.authTokenRepository.findOne({
      where: {
        userId: user._id.toString(),
        type: AuthTokenType.RESET_PASSWORD_VERIFICATION_TOKEN,
        token: token,
      },
    });

    if (!authToken) {
      throw new BadRequestException('Invalid token');
    }

    await Promise.all([
      this.authTokenRepository.delete(authToken._id),
      this.userService.updateUser(user._id.toString(), {
        password: password, // UserService.updateUser handles hashing
      }),
    ]);
    return 'Password reset successful';
  }

  async generateAuthTokenAndSendVerificationCode(
    user: Partial<UserEntity>,
    authType: AuthType,
  ) {
    let verificationCode: string;
    const setAuthTokenType: AuthTokenType =
      authType === AuthType.EMAIL
        ? AuthTokenType.EMAIL_VERIFICATION_TOKEN
        : AuthTokenType.PHONE_VERIFICATION_TOKEN;
    const userVerificationToken = await this.authTokenRepository.findOne({
      where: {
        userId: user._id?.toString(),
        type: setAuthTokenType,
      },
    });
    if (userVerificationToken) {
      verificationCode = userVerificationToken.token;
    } else {
      verificationCode = this.generateNumericOtp();
      await this.authTokenRepository.save(
        this.authTokenRepository.create({
          userId: user._id?.toString(),
          type: setAuthTokenType,
          token: verificationCode,
        }),
      );
    }
    return user;
  }

  async verifyOtp(email: string, token: string, authTokenType: AuthTokenType) {
    const user = await this.userService.getUser({ email: email });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const authToken = await this.authTokenRepository.findOne({
      where: {
        userId: user._id?.toString(),
        type: authTokenType,
        token: token,
      },
    });
    if (!authToken) {
      throw new BadRequestException('Invalid token');
    }
    return authToken;
  }
}
