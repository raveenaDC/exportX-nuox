import { URL, fileURLToPath } from 'node:url';
import path from 'path';
import { jwtSecretKey, otpExpiryTime } from '../config/jwt.config.js';

export function getCurrentWorkingFolder(url) {
  const __filename = fileURLToPath(url);
  const __dirname = path.dirname(__filename);
  return __dirname;
}
