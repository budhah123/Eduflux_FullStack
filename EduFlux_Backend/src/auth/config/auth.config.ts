import { Injectable } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtConfigService } from './jwt.config';

@Injectable()
export class AuthConfig {
  constructor(private configService: ConfigService) {}

  getPassportModule() {
    return PassportModule;
  }

  getJwtModule() {
    return JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('ACCESS_TOKEN_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('ACCESS_TOKEN_EXPIRES_IN'),
        } as any,
      }),
    });
  }

  getAuthProviders() {
    return [JwtConfigService];
  }
}
