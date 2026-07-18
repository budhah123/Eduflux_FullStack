import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/user/entity';
import { JwtStrategy, RefreshTokenStrategy } from './strategies';
import { jwtModuleOptions, JwtConfigService } from './config';
import googleOauthConfig from './config/google-oauth.config';
import { GoogleStrategy } from './strategies/google.strategy';
import { Type } from 'class-transformer';
import { AuthTokenEntity } from './entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuthTokenEntity]),
    UserModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: jwtModuleOptions,
    }),
    ConfigModule.forFeature(googleOauthConfig),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    RefreshTokenStrategy,
    JwtConfigService,
    GoogleStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
