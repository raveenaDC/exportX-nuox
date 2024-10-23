import { responseHelper } from '../utils/response.helper.js';
import { permissionModel, userPermissionModel } from '../db/models/index.js';
import httpStatus from 'http-status';

export default function authorizeMiddleware(permissionIdentifier = '') {
  return async function (req, res, next) {
    if (!permissionIdentifier) {
      return next();
    }

    const { userId } = req.user;
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

    const userPermission = await userPermissionModel.findOne({
      userId,
      permissionId: permission._id,
    });

    if (!userPermission) {
      return responseHelper(
        res,
        httpStatus.UNAUTHORIZED,
        true,
        'Unauthorized to use requested resource'
      );
    }

    next();
  };
}
