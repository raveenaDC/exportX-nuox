import { Router } from 'express';
import * as clientUserService from '../services/client-user.service.js';
import * as validators from '../validations/index.js';
import * as middlewares from '../middleware/index.js';

const roleRoute = Router();

roleRoute.get(
  '/',
  middlewares.authenticateMiddleWare,
  //middlewares.authorizeMiddleware('view-all-client-users'),
  clientUserService.findAll
);

roleRoute.get(
  '/client/:clientId',
  middlewares.authenticateMiddleWare,
  // middlewares.authorizeMiddleware('view-by-client-user-id'),
  clientUserService.findAllByClientId
);

roleRoute.get(
  '/:id',
  middlewares.authenticateMiddleWare,
  //middlewares.authorizeMiddleware('view-client-user'),
  clientUserService.findOne
);

roleRoute.post(
  '/:clientId',
  middlewares.authenticateMiddleWare,
  // middlewares.authorizeMiddleware('create-client-user'),
  clientUserService.create
);

roleRoute.put(
  '/:clientUserId',
  middlewares.authenticateMiddleWare,
  validators.clientUserPermissionValidator,
  middlewares.validationCheckMiddleWare,
  //middlewares.authorizeMiddleware('update-client-user-permission'),
  clientUserService.givePermission
);

roleRoute.delete(
  '/:id',
  middlewares.authenticateMiddleWare,
  //  middlewares.authorizeMiddleware('remove-client-user'),
  clientUserService.remove
);

export default roleRoute;
