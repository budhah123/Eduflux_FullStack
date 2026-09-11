import {
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
  UseGuards,
} from '@nestjs/common';
import {
  AccessTokenGuard,
  RefreshTokenGuard,
  OptionalAccessTokenGuard,
} from '../guards';
import { AdminAccessTokenGuard } from '../guards/admin-access-token.guard';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const ctx = context.switchToHttp().getRequest();
    return ctx.user;
  },
);

export const AtGuard = () => applyDecorators(UseGuards(AccessTokenGuard));

export const OptionalAtGuard = () =>
  applyDecorators(UseGuards(OptionalAccessTokenGuard));

export const RtGuard = () => applyDecorators(UseGuards(RefreshTokenGuard));

export const AdminAtGuard = () =>
  applyDecorators(UseGuards(AdminAccessTokenGuard));
