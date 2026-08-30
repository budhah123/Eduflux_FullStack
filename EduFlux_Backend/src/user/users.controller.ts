import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AtGuard, CurrentUser } from 'src/auth/decorator';
import { UserService } from './user.service';
import { ObjectId } from 'mongodb';

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
    const userId = user._id?.toString?.() ?? user._id;
    const freshUser = await this.userService.getUser({
      _id: ObjectId.isValid(userId) ? new ObjectId(userId) : userId,
    });
    const documentsCount = await this.userService.countCountingUploads(userId);
    const currentProgress = documentsCount % 3;
    const uploadsUntilNextCredit =
      documentsCount === 0 ? 3 : currentProgress === 0 ? 0 : 3 - currentProgress;

    return {
      documentsUploaded: documentsCount,
      approvedUploadCount: documentsCount,
      progressInCurrentCycle: currentProgress,
      uploadsUntilNextCredit,
      unlockCredits: freshUser?.unlockCredits ?? 0,
      creditsEverEarned: freshUser?.creditsEverEarned ?? 0,
    };
  }
}
