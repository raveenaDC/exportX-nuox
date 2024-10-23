import * as models from '../db/models/index.js';
import httpStatus from 'http-status';
import { responseHelper } from '../utils/response.helper.js';
import { verifyJwtToken } from '../utils/encryption.helper.js';

/**
 * authentication check middleware
 * @param {Request} req
 * @param {Response} res
 * @param {Next} next
 */
export default async function (req, res, next) {
  try {
    const headers = req.headers;

    if (!headers['authorization']) {
      return responseHelper(res, httpStatus.UNAUTHORIZED, true, 'unauthorized');
    }
    const token = headers['authorization'].split(' ')[1];

    if (!token) {
      return responseHelper(res, httpStatus.UNAUTHORIZED, true, 'unauthorized');
    }

    const tokenVerificationResult = verifyJwtToken(token);
    if (!tokenVerificationResult.validToken) {
      return responseHelper(
        res,
        httpStatus.UNAUTHORIZED,
        true,
        'invalid token'
      );
    }
    const userId =
      tokenVerificationResult.data.userId ||
      tokenVerificationResult.data.clientId ||
      tokenVerificationResult.data.clientUserId;
    //check in db if token is valid
    const tokenCheck = await models.tokenModel.findOne({
      userId: userId,
      tokenType: 'authentication',
      active: true,
    });

    if (!tokenCheck) {
      return responseHelper(
        res,
        httpStatus.UNAUTHORIZED,
        true,
        'invalid token'
      );
    }

    req.user = tokenVerificationResult.data;
    req.token = token;
    next();
  } catch (err) {
    return responseHelper(res, httpStatus.UNAUTHORIZED, true, err.message);
  }
}
