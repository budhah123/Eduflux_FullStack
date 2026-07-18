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
import { AdminAtGuard } from 'src/auth/decorator';
import { PaginationInput } from 'src/common/pagination';
import { CreateUserInput, UpdateUserInput } from 'src/user/dto';
import { UserOutput } from 'src/user/dto/user.output';
import { UserService } from 'src/user/user.service';

@ApiTags('Admin User Management')
@ApiSecurity('JWT-auth')
@Controller('admin/user')
export class AdminUserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @AdminAtGuard()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiCreatedResponse({
    description: 'User created successfully',
    type: CreateUserInput,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - No token provided' })
  async createUser(@Body() createUserInput: CreateUserInput) {
    const { email } = createUserInput;
    const user = await this.userService.getUser({
      email: email,
    });
    if (user) {
      throw new BadRequestException(`User with email ${email} already exists`);
    }
    return await this.userService.createUser(createUserInput);
  }

  @Get()
  @AdminAtGuard()
  @ApiOperation({ summary: 'Get list of users' })
  @ApiOkResponse({
    description: 'List of users retrieved successfully',
    type: [UserOutput],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - No token provided' })
  async getUsers(@Query() paginationInput: PaginationInput) {
    const [users, count] = await this.userService.getUsers(
      undefined,
      undefined,
      paginationInput,
    );
    return {
      data: users,
      meta: {
        total: count,
        page: paginationInput?.page || 1,
        limit: paginationInput?.limit || 10,
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
  ) {
    const user = await this.getUserById(id);
    if (!user) {
      throw new BadRequestException(`User with ID ${id} not found`);
    }
    const result = await this.userService.updateUser(id, updateUserInput);
    if (result.affected === 1) {
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
  async deleteUser(@Param('id') id: string) {
    const user = await this.getUserById(id);
    if (!user) {
      throw new BadRequestException(`User with ID ${id} not found`);
    }
    const result = await this.userService.deleteUser(id);
    if (result.affected === 1) {
      return {
        message: `User with ID ${id} deleted successfully`,
      };
    }
    throw new BadRequestException(`Failed to delete user with ID ${id}`);
  }
}
