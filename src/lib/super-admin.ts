// Super Admin emails - these users have full power and cannot have their admin status removed
export const SUPER_ADMIN_EMAILS = [
  'kbelkhalfi@gmail.com',
  'contact@jazelwebagency.com',
];

// Check if an email is a super admin
export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
}
