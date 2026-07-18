import { ConfigService } from '@nestjs/config';
import { JwtConfigService } from './jwt.config';

export const jwtModuleOptions = (
  configService: ConfigService,
  jwtConfigService?: JwtConfigService,
) => {
  return {
    secret: configService.get<string>('ACCESS_TOKEN_SECRET'),
    signOptions: {
      expiresIn: configService.get<string>('ACCESS_TOKEN_EXPIRES_IN'),
    } as any,
  };
};
