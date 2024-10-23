import rateLimit from 'express-rate-limit';
import httpStatus from 'http-status';
import { responseHelper } from '../utils/response.helper.js';
const ONE_MINUTE = 1 * 60 * 1000;
const MAX_NO_OF_REQUEST = 50;
export const RateLimiter = rateLimit({
  windowMs: ONE_MINUTE,
  max: MAX_NO_OF_REQUEST,
  handler: (req, res) => {
    return responseHelper(
      res,
      httpStatus.TOO_MANY_REQUESTS,
      true,
      'Too many requests, please try again later'
    );
  },
});
