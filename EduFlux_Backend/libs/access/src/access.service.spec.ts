import { AccessService } from './access.service';

describe('AccessService', () => {
  let service: AccessService;
  let userRepo: { save: jest.Mock };
  let subRepo: { findOne: jest.Mock };

  beforeEach(() => {
    userRepo = { save: jest.fn().mockResolvedValue(true) };
    subRepo = { findOne: jest.fn().mockResolvedValue(null) };
    service = new AccessService(userRepo as any, subRepo as any);
  });

  it('allows institutional users to view premium documents without granting download access', async () => {
    const user = {
      _id: '67ab3f2a9f2f1e2a00000001',
      isInstitutional: true,
      isVerified: true,
      unlockCredits: 0,
    } as any;

    await expect(service.checkViewAccess(user)).resolves.toEqual({
      access: true,
      reason: 'institutional',
    });

    await expect(service.checkDownloadAccess(user)).resolves.toEqual({
      access: false,
      reason: 'locked',
    });
  });

  it('keeps the legacy checkAccess alias aligned with view access', async () => {
    const user = {
      _id: '67ab3f2a9f2f1e2a00000002',
      isInstitutional: true,
      isVerified: true,
      unlockCredits: 0,
    } as any;

    await expect(service.checkAccess(user)).resolves.toEqual({
      access: true,
      reason: 'institutional',
    });
  });
});
