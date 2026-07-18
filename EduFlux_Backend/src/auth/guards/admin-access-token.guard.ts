import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserType } from 'src/user/enum';

export class AdminAccessTokenGuard extends AuthGuard('access-token-jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication token required');
    }

    if (user.userType !== UserType.ADMIN) {
      throw new ForbiddenException('Access denied: Admin role required');
    }

    return user;
  }
}
