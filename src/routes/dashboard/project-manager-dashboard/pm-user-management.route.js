import { Router } from 'express';
import * as projectManagerUserManagementService from '../../../services/dashboard-service/project-manager-dashboard/pm-user-management.service.js';
import * as validators from '../../../validations/index.js';
import * as middlewares from '../../../middleware/index.js';

const pmUserManagementRoute = Router();

pmUserManagementRoute.post(
  '/add-user',
  middlewares.authenticateMiddleWare,
  validators.userValidator,
  middlewares.validationCheckMiddleWare,
  projectManagerUserManagementService.create
);
pmUserManagementRoute.get(
  '/:id',
  middlewares.authenticateMiddleWare,
  projectManagerUserManagementService.findOne
);

pmUserManagementRoute.get(
  '/view-all-users',
  middlewares.authenticateMiddleWare,
  validators.userGetValidators,
  middlewares.validationCheckMiddleWare,
  projectManagerUserManagementService.findAll
);
pmUserManagementRoute.patch(
  '/:id',
  middlewares.multerErrorHandleMiddleWare(
    middlewares.fileUploadMiddleware('images/')
  ),
  middlewares.authenticateMiddleWare,
  validators.userUpdatesValidator,
  middlewares.validationCheckMiddleWare,
  projectManagerUserManagementService.update
);
pmUserManagementRoute.put(
  '/:userId/system-access',
  middlewares.authenticateMiddleWare,
  validators.userSystemAccessValidator,
  middlewares.validationCheckMiddleWare,
  projectManagerUserManagementService.enableOrDisableSystemAccess
);

pmUserManagementRoute.delete(
  '/:id',
  middlewares.authenticateMiddleWare,
  projectManagerUserManagementService.remove
);

export default pmUserManagementRoute;
