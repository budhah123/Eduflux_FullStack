import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AtGuard, CurrentUser } from 'src/auth/decorator';
import { FileUploadService } from '@app/file-upload';
import { UserService } from './user.service';
import { UpdateProfileInput, ChangePasswordInput } from './dto';
import { ObjectId } from 'mongodb';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly uploadService: FileUploadService,
  ) {}

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
      approvedUploadCount: documentsCount, // Backward compatibility
      progressInCurrentCycle: currentProgress, // e.g. 2 of 3
      uploadsUntilNextCredit,
      unlockCredits: freshUser?.unlockCredits ?? 0,
      creditsEverEarned: freshUser?.creditsEverEarned ?? 0,
    };
  }

  @Patch('me')
  @AtGuard()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update my profile (first/last name)' })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() dto: UpdateProfileInput,
  ) {
    const id = user._id?.toString?.() ?? user._id;
    await this.userService.updateUser(id, dto);
    const updated = await this.userService.getUser({ _id: user._id });
    return {
      _id: id,
      firstName: updated?.firstName || '',
      lastName: updated?.lastName || '',
      fullName:
        [updated?.firstName, updated?.lastName].filter(Boolean).join(' ') ||
        updated?.email?.split('@')?.[0] ||
        'User',
      email: updated?.email,
      avatarUrl: updated?.avatarUrl || null,
    };
  }

  @Patch('me/password')
  @AtGuard()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Change my password' })
  async changePassword(
    @CurrentUser() user: any,
    @Body() dto: ChangePasswordInput,
  ) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException(
        'New password and confirm password do not match',
      );
    }
    const id = user._id?.toString?.() ?? user._id;
    return this.userService.changePassword(
      id,
      dto.oldPassword,
      dto.newPassword,
    );
  }

  @Post('me/avatar')
  @AtGuard()
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: 'Upload/replace my avatar image' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        file.mimetype.startsWith('image/')
          ? cb(null, true)
          : cb(new Error('Only image files are allowed'), false);
      },
    }),
  )
  async uploadAvatar(
    @CurrentUser() user: any,
    @UploadedFile() file: { buffer: Buffer; originalname: string },
  ) {
    const id = user._id?.toString?.() ?? user._id;
    const { fileUrl } = await this.uploadService.uploadFile(
      file.buffer,
      file.originalname,
      id,
    );
    await this.userService.updateUser(id, { avatarUrl: fileUrl } as any);
    return { avatarUrl: fileUrl };
  }
}