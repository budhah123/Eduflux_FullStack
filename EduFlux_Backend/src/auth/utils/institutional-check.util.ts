/**
 * Determines whether an email address belongs to a configured institutional domain.
 *
 * Reads the comma-separated list of allowed domains from
 * INSTITUTIONAL_EMAIL_DOMAINS (e.g. "cps.edu.np,ku.edu.np").
 *
 * Single source of truth — import this everywhere a new user can be created
 * (email/password register, Google OAuth, any future OAuth providers) so the
 * logic can never drift between code paths.
 */
export function computeIsInstitutional(email: string): boolean {
  const allowedDomains = (process.env.INSTITUTIONAL_EMAIL_DOMAINS || '')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

  const emailDomain = email.split('@')[1]?.toLowerCase();
  if (!emailDomain) return false;

  return allowedDomains.includes(emailDomain);
}
