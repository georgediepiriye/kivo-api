import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export const signToken = (id: string): string => {
  // We explicitly type the options to match SignOptions
  const signOptions: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as any, // Cast to any or the specific StringValue type
  };

  return jwt.sign({ id }, env.JWT_SECRET, signOptions);
};
