import {
  Body,
  Controller,
  Post,
  Get,
  Query,
  BadRequestException,
  Param,
  Patch,
  Delete,
  Req,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiSecurity,
  ApiOkResponse,
} from '@nestjs/swagger';
import { ObjectId } from 'mongodb';
import { AuditLogService } from 'src/audit-log/audit-log.service';
import { AdminAtGuard } from 'src/auth/decorator';
import { PaginationInput } from 'src/common/pagination';
import { CreateUserInput, UpdateUserInput } from 'src/user/dto';
import { UserOutput } from 'src/user/dto/user.output';
import { UserService } from 'src/user/user.service';
@ApiTags('Admin User Management')
@ApiSecurity('JWT-auth')
@Controller('admin/user')
export class AdminUserController {
  constructor(
    private readonly userService: UserService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post()
  @AdminAtGuard()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiCreatedResponse({
    description: 'User created successfully',
    type: CreateUserInput,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - No token provided' })
  async createUser(@Body() createUserInput: CreateUserInput, @Req() req) {
    const { email } = createUserInput;
    const user = await this.userService.getUser({
      email: email,
    });
    if (user) {
      throw new BadRequestException(`User with email ${email} already exists`);
    }
    const createdUser = await this.userService.createUser(createUserInput);
    await this.auditLogService.logAdminAction({
      adminUserId: req.user?._id?.toString?.() ?? req.user?.id ?? 'system',
      action: 'created_user',
      targetType: 'user',
      targetId: String(createdUser._id),
      targetName: createdUser.email,
      details: `Admin created user ${createdUser.email}`,
      timestamp: new Date(),
    });
    return createdUser;
  }

  @Get()
  @AdminAtGuard()
  @ApiOperation({ summary: 'Get list of users' })
  @ApiOkResponse({
    description: 'List of users retrieved successfully',
    type: [UserOutput],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - No token provided' })
  async getUsers(
    @Query() paginationInput: PaginationInput,
    @Query('search') search?: string,
    @Query('userType') userType?: string,
  ) {
    const where: any = {};
    if (userType && userType !== 'All') {
      where.userType = userType;
    }
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      where.$or = [
        { email: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
      ];
    }

    const [users, count] = await this.userService.getUsers(
      where,
      undefined,
      paginationInput,
    );
    return {
      data: users,
      meta: {
        total: count,
        page: paginationInput?.page || 1,
        limit: paginationInput?.limit || 10,
        totalPages: Math.ceil(count / (paginationInput?.limit || 10)) || 1,
      },
    };
  }

  @Get(':id')
  @AdminAtGuard()
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiOkResponse({
    description: 'User retrieved successfully',
    type: UserOutput,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - No token provided' })
  async getUserById(@Param('id') id: string) {
    const user = await this.userService.getUser({ _id: new ObjectId(id) });
    if (!user) {
      throw new BadRequestException(`User with ID ${id} not found`);
    }
    return user;
  }

  @Patch(':id')
  @AdminAtGuard()
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiOkResponse({
    description: 'User updated successfully',
    type: UserOutput,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - No token provided' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserInput: UpdateUserInput,
    @Req() req,
  ) {
    const user = await this.getUserById(id);
    if (!user) {
      throw new BadRequestException(`User with ID ${id} not found`);
    }
    const result = await this.userService.updateUser(id, updateUserInput);
    if (result.affected === 1) {
      await this.auditLogService.logAdminAction({
        adminUserId: req.user?._id?.toString?.() ?? req.user?.id ?? 'system',
        action: 'updated_user',
        targetType: 'user',
        targetId: id,
        targetName: user.email,
        details: `Admin updated user ${user.email}`,
        timestamp: new Date(),
      });
      return {
        message: `User with ID ${id} updated successfully`,
      };
    }
    throw new BadRequestException(`Failed to update user with ID ${id}`);
  }

  @Delete(':id')
  @AdminAtGuard()
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiOkResponse({
    description: 'User deleted successfully',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - No token provided' })
  async deleteUser(@Param('id') id: string, @Req() req) {
    const user = await this.getUserById(id);
    if (!user) {
      throw new BadRequestException(`User with ID ${id} not found`);
    }
    const result = await this.userService.deleteUser(id);
    if (result.affected === 1) {
      await this.auditLogService.logAdminAction({
        adminUserId: req.user?._id?.toString?.() ?? req.user?.id ?? 'system',
        action: 'deleted_user',
        targetType: 'user',
        targetId: id,
        targetName: user.email,
        details: `Admin deleted user ${user.email}`,
        timestamp: new Date(),
      });
      return {
        message: `User with ID ${id} deleted successfully`,
      };
    }
    throw new BadRequestException(`Failed to delete user with ID ${id}`);
  }
}
