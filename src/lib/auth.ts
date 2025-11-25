import crypto from 'crypto';

/**
 * Hashes a password using scrypt.
 * @param password The plain text password.
 * @returns An object containing the salt and the hashed password.
 */
export function hashPassword(password: string) {
  // Generate a random unique salt for this user
  const salt = crypto.randomBytes(16).toString('hex');
  
  // Hash the password with the salt
  // keylen: 64 gives us a 128-character hex string
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  
  return { hash, salt };
}

/**
 * Verifies a password against a stored hash and salt.
 * @param password The plain text password to check.
 * @param hash The stored hash from the database.
 * @param salt The stored salt from the database.
 * @returns True if the password is correct, false otherwise.
 */
export function verifyPassword(password: string, hash: string, salt: string) {
  const verifyHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return hash === verifyHash;
}