import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class DatabaseConfigService implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    const dbName = process.env.DB_NAME || 'dev';
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is not defined');
    }

    return {
      type: 'mongodb',
      url: mongoUri,
      database: dbName,
      synchronize: process.env.NODE_ENV !== 'production',
      autoLoadEntities: true,
      logging: process.env.NODE_ENV === 'development',
      extra: {
        retryWrites: true,
        w: 'majority',
      },
    } as TypeOrmModuleOptions;
  }
}
