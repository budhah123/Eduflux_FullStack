import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { JwtConfigService } from './config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthTokenEntity } from './entity';
import { MailService } from '@app/mail';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: {
    createUser: jest.Mock;
    getUser: jest.Mock;
  };
  let authTokenRepo: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    delete: jest.Mock;
  };
  let mailService: {
    sendVerificationEmail: jest.Mock;
    sendResetPasswordEmail: jest.Mock;
  };

  beforeEach(async () => {
    process.env.INSTITUTIONAL_EMAIL_DOMAINS = 'cps.edu.np,university.edu';

    userService = {
      createUser: jest.fn().mockImplementation((dto) => Promise.resolve({ ...dto, _id: 'user-123' })),
      getUser: jest.fn().mockResolvedValue(null),
    };

    authTokenRepo = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockResolvedValue({}),
      findOne: jest.fn().mockResolvedValue(null),
      delete: jest.fn().mockResolvedValue({}),
    };

    mailService = {
      sendVerificationEmail: jest.fn().mockResolvedValue(true),
      sendResetPasswordEmail: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('mock-jwt-token') },
        },
        {
          provide: JwtConfigService,
          useValue: {
            getAccessTokenSecret: () => 'access-secret',
            getRefreshTokenSecret: () => 'refresh-secret',
            getRefreshTokenExpiresIn: () => '7d',
          },
        },
        {
          provide: getRepositoryToken(AuthTokenEntity),
          useValue: authTokenRepo,
        },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    delete process.env.INSTITUTIONAL_EMAIL_DOMAINS;
  });

  it('computes isInstitutional as true for allowed institutional domain', async () => {
    const input = {
      email: 'student@cps.edu.np',
      password: 'Password123!',
      firstName: 'Student',
      lastName: 'One',
    };

    await authService.register(input as any);

    expect(userService.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'student@cps.edu.np',
        isInstitutional: true,
      }),
    );
  });

  it('computes isInstitutional as false for public domain', async () => {
    const input = {
      email: 'student@gmail.com',
      password: 'Password123!',
      firstName: 'Student',
      lastName: 'Two',
    };

    await authService.register(input as any);

    expect(userService.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'student@gmail.com',
        isInstitutional: false,
      }),
    );
  });

  it('ignores client-supplied isInstitutional parameter and overrides with domain check', async () => {
    const input = {
      email: 'attacker@gmail.com',
      password: 'Password123!',
      firstName: 'Attacker',
      lastName: 'User',
      isInstitutional: true, // Client trying to elevate privilege
    };

    await authService.register(input as any);

    expect(userService.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'attacker@gmail.com',
        isInstitutional: false,
      }),
    );
  });
});
