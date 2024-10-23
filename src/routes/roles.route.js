import { Router } from 'express';
import * as roleService from '../services/role.service.js';
import * as validators from '../validations/index.js';
import * as middlewares from '../middleware/index.js';
const roleRoute = Router();

roleRoute.get(
  '/',
  middlewares.authenticateMiddleWare,
  // middlewares.authorizeMiddleware('get-roles'),
  roleService.findAll
);
roleRoute.get(
  '/:roleId/get',
  middlewares.authenticateMiddleWare,
  // middlewares.authorizeMiddleware('get-roles'),
  roleService.findRoleById
);
roleRoute.get(
  '/active',
  middlewares.authenticateMiddleWare,
  // middlewares.authorizeMiddleware('get-active-role'),
  roleService.findAllActiveRole
);
roleRoute.post(
  '/',
  middlewares.authenticateMiddleWare,
  // middlewares.authorizeMiddleware('create-role'),
  validators.roleValidator,
  middlewares.validationCheckMiddleWare,
  roleService.create
);

roleRoute.patch(
  '/:id',
  middlewares.authenticateMiddleWare,
  // middlewares.authorizeMiddleware('update-role'),
  validators.roleValidator,
  middlewares.validationCheckMiddleWare,
  roleService.update
);

roleRoute.patch(
  '/:id/status',
  middlewares.authenticateMiddleWare,
  // middlewares.authorizeMiddleware('update-role-status'),
  validators.activationStatusValidator,
  middlewares.validationCheckMiddleWare,
  roleService.updateStatus
);

roleRoute.delete(
  '/:id',
  middlewares.authenticateMiddleWare,
  // middlewares.authorizeMiddleware('delete-role'),
  roleService.remove
);

export default roleRoute;
