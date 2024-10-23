import { responseHelper } from '../utils/response.helper.js';
import { permissionModel, userPermissionModel } from '../db/models/index.js';
import httpStatus from 'http-status';

export default function clientAuthorizeMiddleware(permissionIdentifier = '') {
  return async function (req, res, next) {
    if (!permissionIdentifier) {
      return next(); // No permissionIdentifier, proceed to the next middleware
    }

    const { clientId } = req.user;
    const permission = await permissionModel.findOne({
      identifier: permissionIdentifier,
    });

    if (!permission || !permission.active) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Permission not found or not active'
      );
    }

    const clientPermission = await userPermissionModel.findOne({
      clientId,
      permissionId: permission._id,
    });

    if (!clientPermission) {
      return responseHelper(
        res,
        httpStatus.UNAUTHORIZED,
        true,
        'Unauthorized to use requested resource'
      );
    }

    next(); // User has the required permission, proceed to the next middleware
  };
}
