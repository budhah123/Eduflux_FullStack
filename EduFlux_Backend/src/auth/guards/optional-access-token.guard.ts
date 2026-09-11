import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalAccessTokenGuard extends AuthGuard('access-token-jwt') {
  handleRequest(err: any, user: any) {
    // Return the user if authenticated, or null if guest/unauthenticated without throwing 401
    return user || null;
  }
}
