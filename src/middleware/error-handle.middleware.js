import httpStatus from 'http-status';
import { responseHelper } from '../utils/response.helper.js';
const environment = process.env.NODE_ENV;
export function errorHandleMiddleware(error, req, res, next) {
  if (environment === 'development') {
    console.log('\n******************** errors *******************\n');
    console.log('timestamp: ' + new Date().toUTCString() + '\n', error);
    console.log('\n******************** errors *******************\n');
  }

  return responseHelper(
    res,
    httpStatus.INTERNAL_SERVER_ERROR,
    true,
    error.message
  );
}
