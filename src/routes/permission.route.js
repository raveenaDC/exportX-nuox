import { Router } from 'express';
import * as permissionService from '../services/permission.service.js';
import * as validators from '../validations/index.js';
import * as middlewares from '../middleware/index.js';
const permissionRoute = Router();

//permission created while creating role
permissionRoute.get(
  '/roles',
  middlewares.authenticateMiddleWare,
  permissionService.getRoles
);
permissionRoute.get(
  '/role/:roleId',
  middlewares.authenticateMiddleWare,
  permissionService.getRolesById
);

permissionRoute.post(
  '/',
  middlewares.authenticateMiddleWare,
  validators.permissionCreateValidator,
  middlewares.validationCheckMiddleWare,
  permissionService.createPermission
);

permissionRoute.get(
  '/:permissionId',
  middlewares.authenticateMiddleWare,
  permissionService.getPermission
);

permissionRoute.patch(
  '/:permissionId/:parentId/:controlId',
  middlewares.authenticateMiddleWare,
  validators.permissionActiveStatusValidator,
  middlewares.validationCheckMiddleWare,
  permissionService.updatePermissionControlActiveStatus
);

permissionRoute.patch(
  '/:permissionId/:parentId',
  middlewares.authenticateMiddleWare,
  validators.permissionActiveStatusValidator,
  middlewares.validationCheckMiddleWare,
  permissionService.updateAccessToAllControlsStatus
);
export default permissionRoute;
