/**
 * Central admin identification.
 *
 * This intentionally reuses the existing FotoFlow admin gate instead of
 * introducing a new role/permission system:
 *   - the hard-coded admin account used by the Sidebar / AdminPanel, and
 *   - an explicit `isAdmin` flag or `admin` role already present on a user doc.
 *
 * Keep this logic in one place so hidden developer features and navigation
 * cannot drift apart.
 */
export const ADMIN_EMAILS = ['abhaykvincent@gmail.com'];

const hasAdminRole = (roles) => {
  if (!roles) return false;
  if (Array.isArray(roles)) {
    return roles.some((role) => String(role).toLowerCase() === 'admin');
  }
  return String(roles).toLowerCase() === 'admin';
};

export const isAdminUser = (user) => {
  if (!user || typeof user !== 'object') return false;

  const email = typeof user.email === 'string' ? user.email.trim().toLowerCase() : '';
  if (ADMIN_EMAILS.includes(email)) return true;

  if (user.isAdmin === true) return true;

  return (
    hasAdminRole(user.role) ||
    hasAdminRole(user.roles) ||
    hasAdminRole(user.projectAccess?.roles)
  );
};
