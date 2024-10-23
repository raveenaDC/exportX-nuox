import { Router } from 'express';
import * as clientUserManagementService from '../../../services/dashboard-service/client-dashboard/client-user-management.service.js';
import * as validators from '../../../validations/index.js';
import * as middlewares from '../../../middleware/index.js';

const userManagementRoute = Router();

userManagementRoute.get(
  '/:projectId',
  middlewares.authenticateMiddleWare,
  clientUserManagementService.findProjectById
);
userManagementRoute.patch(
  '/:projectId/client-users',
  middlewares.authenticateMiddleWare,
  validators.projectUserManagementValidator,
  middlewares.validationCheckMiddleWare,
  clientUserManagementService.addClientUser
);

userManagementRoute.patch(
  '/:projectId/make-client-coordinator',
  middlewares.authenticateMiddleWare,
  validators.projectUserManagementValidator,
  middlewares.validationCheckMiddleWare,
  clientUserManagementService.makeClientCoordinator
);

userManagementRoute.delete(
  '/:projectId/:clientUserId',
  middlewares.authenticateMiddleWare,
  clientUserManagementService.removeClientUser
);
export default userManagementRoute;
