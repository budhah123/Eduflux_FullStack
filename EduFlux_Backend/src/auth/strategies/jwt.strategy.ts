import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from 'src/user/user.service';
import { JwtConfigService } from '../config';

@Injectable()
export class JwtStrategy extends PassportStrategy(
  Strategy,
  'access-token-jwt',
) {
  constructor(
    private readonly userService: UserService,
    private readonly jwtConfigService: JwtConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfigService.getAccessTokenSecret(),
    });
  }

  async validate(payload: any) {
    if (!payload.email) {
      return null;
    }
    const user = await this.userService.getUser({ email: payload.email });
    if (!user) {
      return null;
    }
    return user;
  }
}
