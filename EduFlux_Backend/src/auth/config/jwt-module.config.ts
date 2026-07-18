import { ConfigService } from '@nestjs/config';

export const jwtModuleOptions = (configService: ConfigService) => {
  return {
    secret: configService.get<string>('ACCESS_TOKEN_SECRET'),
    signOptions: {
      expiresIn: configService.get<string>('ACCESS_TOKEN_EXPIRES_IN'),
    } as any,
  };
};
