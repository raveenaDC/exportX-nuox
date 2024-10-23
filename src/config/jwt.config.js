import * as dotenv from 'dotenv';
dotenv.config();
export const jwtSecretKey = process.env.JWT_SECRET ?? 'secret011';
export const hashSalt = 10;
export const otpExpiryTime = 6000;
