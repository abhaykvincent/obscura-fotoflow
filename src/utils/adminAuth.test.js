import { isAdminUser, ADMIN_EMAILS } from './adminAuth';

describe('isAdminUser', () => {
  it('accepts the existing hard-coded admin account', () => {
    expect(isAdminUser({ email: ADMIN_EMAILS[0] })).toBe(true);
    expect(isAdminUser({ email: `  ${ADMIN_EMAILS[0].toUpperCase()}  ` })).toBe(true);
  });

  it('accepts an explicit isAdmin flag or admin role', () => {
    expect(isAdminUser({ email: 'someone@example.com', isAdmin: true })).toBe(true);
    expect(isAdminUser({ email: 'someone@example.com', role: 'Admin' })).toBe(true);
    expect(isAdminUser({ email: 'someone@example.com', roles: ['photographer', 'admin'] })).toBe(true);
  });

  it('rejects guests and normal users', () => {
    expect(isAdminUser(null)).toBe(false);
    expect(isAdminUser({})).toBe(false);
    expect(isAdminUser({ email: 'client@example.com', roles: ['photographer'] })).toBe(false);
  });
});
