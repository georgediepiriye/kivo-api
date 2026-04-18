import jwt, { SignOptions } from "jsonwebtoken";
import config from "../config/config.js";
import type { StringValue } from "ms"; // Import the specific type

/**
 * Signs a JWT token with the configured expiration.
 */
export const signToken = (id: string): string => {
  const signOptions: SignOptions = {
    // We cast as StringValue to satisfy the jsonwebtoken type definition
    expiresIn: `${config.jwt.refreshExpirationDays}d` as StringValue,
  };

  return jwt.sign({ id }, config.jwt.secret, signOptions);
};
