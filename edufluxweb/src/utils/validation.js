/**
 * Checks if the given email is from the institutional domain @cps.edu.np
 * @param {string} email
 * @returns {boolean}
 */
export const checkIsInstitutional = (email) => {
  if (!email) return false;
  return email.trim().toLowerCase().endsWith('@cps.edu.np');
};
