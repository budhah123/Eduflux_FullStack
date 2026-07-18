import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserInput } from './dto';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOperation,
} from '@nestjs/swagger';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiCreatedResponse({
    description: 'The user has been successfully created.',
  })
  @ApiBadRequestResponse({ description: 'User with this email already exists' })
  async createUser(@Body() createUserInput: CreateUserInput) {
    const { email } = createUserInput;
    const existingUser = await this.userService.getUser({ email });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }
    return this.userService.createUser(createUserInput);
  }
}
