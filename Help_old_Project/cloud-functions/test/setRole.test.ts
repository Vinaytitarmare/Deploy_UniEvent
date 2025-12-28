import * as admin from 'firebase-admin';
import * as ftest from 'firebase-functions-test';
import { setRole } from '../src/setRole';

// Initialize test sdk
const test = ftest();

describe('setRole', () => {
  let wrapped: any;

  beforeAll(() => {
    wrapped = test.wrap(setRole);
  });

  afterAll(() => {
    test.cleanup();
  });

  it('should throw if unauthenticated', async () => {
    const context = {}; // No auth
    await expect(wrapped({ uid: 'test', role: 'admin' }, context)).rejects.toThrow('unauthenticated');
  });

  it('should throw if not admin', async () => {
    const context = { auth: { uid: 'user', token: { admin: false } } };
    await expect(wrapped({ uid: 'test', role: 'admin' }, context)).rejects.toThrow('permission-denied');
  });

  it('should succeed if admin', async () => {
    const context = { auth: { uid: 'admin', token: { admin: true } } };
    
    // Mock admin.auth().setCustomUserClaims
    const setCustomUserClaimsStub = jest.spyOn(admin.auth(), 'setCustomUserClaims').mockResolvedValue();
    // Mock firestore
    const firestoreStub = jest.spyOn(admin.firestore(), 'collection').mockReturnValue({
      doc: jest.fn().mockReturnValue({
        set: jest.fn().mockResolvedValue({})
      })
    } as any);

    await wrapped({ uid: 'targetUid', role: 'club' }, context);

    expect(setCustomUserClaimsStub).toHaveBeenCalledWith('targetUid', { club: true });
  });
});
