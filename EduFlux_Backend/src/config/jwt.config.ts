import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtConfigService {
  constructor(private configService: ConfigService) {}

  getAccessTokenSecret(): string {
    return (
      this.configService.get<string>('ACCESS_TOKEN_SECRET') ||
      'default-access-secret'
    );
  }

  getAccessTokenExpiresIn(): string {
    return this.configService.get<string>('ACCESS_TOKEN_EXPIRES_IN') || '1d';
  }

  getRefreshTokenSecret(): string {
    return (
      this.configService.get<string>('REFRESH_TOKEN_SECRET') ||
      'default-refresh-secret'
    );
  }

  getRefreshTokenExpiresIn(): string {
    return this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN') || '7d';
  }
}
