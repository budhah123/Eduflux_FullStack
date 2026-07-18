import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, ObjectId, ObjectIdColumn } from 'typeorm';

@Entity('auth_tokens')
export class AuthTokenEntity {
  @ApiProperty({
    description: 'The unique identifier of the auth token',
    type: String,
    example: '64b8f0f2e1d3c2a5f6b7c8d9',
  })
  @ObjectIdColumn()
  _id: ObjectId;

  @ApiProperty({
    description: 'The ID of the user associated with the auth token',
    type: String,
    example: '64b8f0f2e1d3c2a5f6b7c8d8',
  })
  @Column('varchar', { name: 'userId' })
  userId: string;

  @ApiProperty({
    description: 'The type of the auth token',
    type: String,
  })
  @Column('varchar', { name: 'type' })
  type: string;

  @ApiProperty({
    description: 'The auth token string',
    type: String,
    example: '34566',
  })
  @Column('varchar', { name: 'token' })
  token: string;
}
