import { ApiProperty } from '@nestjs/swagger';
import { ObjectId } from 'mongodb';
import { CommonAttribute } from 'src/common/attribute/common.attribute';
import { BeforeInsert, Column, Entity, ObjectIdColumn } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { BadRequestException } from '@nestjs/common';
import { UserType } from '../enum';

@Entity('users')
export class UserEntity extends CommonAttribute {
  @ApiProperty({
    description: 'Unique identifier for the user',
    type: String,
    example: '64b7f8c2e1d3c2a5f0a1b2c3',
  })
  @ObjectIdColumn()
  _id: ObjectId;

  @ApiProperty({
    description: 'First name of the user',
    type: String,
    example: 'John',
  })
  @Column('varchar', { name: 'firstName' })
  firstName?: string;

  @ApiProperty({
    description: 'Last name of the user',
    type: String,
    example: 'Doe',
  })
  @Column('varchar', { name: 'lastName' })
  lastName?: string;

  @ApiProperty({
    description: 'Email address of the user',
    type: String,
    example: 'john.doe@example.com',
  })
  @Column('varchar', { name: 'email' })
  email: string;

  @ApiProperty({
    description: 'Password of the user',
    type: String,
    example: 'securePassword123',
    required: false,
  })
  @Column('varchar', { name: 'password', nullable: true })
  password?: string;

  @ApiProperty({
    description: 'Indicates whether the user is active',
    type: Boolean,
    example: true,
  })
  @Column('boolean', { name: 'isActive', default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Indicates whether the user is an institutional user',
    type: Boolean,
    example: false,
  })
  @Column('boolean', { name: 'isInstitutional', default: false })
  isInstitutional: boolean;

  @ApiProperty({
    description: 'Type of the user',
    type: String,
    example: UserType.USER,
  })
  @Column('varchar', { name: 'userType', default: UserType.USER })
  userType?: UserType;

  @BeforeInsert()
  async hashedPassword() {
    // Only hash password if it exists (skip for OAuth users)
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }

    // Set default userType if not provided
    if (!this.userType) {
      this.userType = UserType.USER;
    }
  }
}
