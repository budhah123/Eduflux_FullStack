import { Controller, Get, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AtGuard, CurrentUser } from 'src/auth/decorator';
import { UserService } from './user.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @AtGuard()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my profile' })
  async me(@CurrentUser() user: any) {
    return {
      _id: user._id?.toString?.() ?? user._id,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      fullName:
        [user.firstName, user.lastName].filter(Boolean).join(' ') ||
        user.email?.split('@')?.[0] ||
        'User',
      email: user.email,
      avatarUrl: user.avatarUrl || user.profilePicture || null,
      isInstitutional: !!user.isInstitutional,
    };
  }

  @Get('me/upload-progress')
  @AtGuard()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my upload progress' })
  async uploadProgress(@CurrentUser() user: any) {
    const approvedUploadCount = Number(user.approvedUploadCount || 0);
    const unlockCredits = Number(user.unlockCredits || 0);
    const uploadsUntilNextCredit =
      unlockCredits > 0 ? 0 : Math.max(0, 3 - (approvedUploadCount % 3 || 3));

    return {
      approvedUploadCount,
      unlockCredits,
      uploadsUntilNextCredit,
    };
  }
}
