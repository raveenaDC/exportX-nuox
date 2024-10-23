import { Router } from 'express';
import * as projectManagerClientManagementService from '../../../services/dashboard-service/project-manager-dashboard/pm-client-management.service.js';
import * as validators from '../../../validations/index.js';
import * as middlewares from '../../../middleware/index.js';

const pmClientManagementRoute = Router();

pmClientManagementRoute.get(
  '/view-all-clients',
  middlewares.authenticateMiddleWare,
  validators.clientGetValidators,
  middlewares.validationCheckMiddleWare,
  projectManagerClientManagementService.list
);
pmClientManagementRoute.get(
  '/:clientId',
  middlewares.authenticateMiddleWare,
  projectManagerClientManagementService.findOne
);

pmClientManagementRoute.post(
  '/create-client',
  middlewares.authenticateMiddleWare,
  middlewares.multerErrorHandleMiddleWare(
    middlewares.fileUploadMiddleware('images/')
  ),
  validators.imageValidator,
  validators.colorCodeValidator,
  middlewares.validationCheckMiddleWare,
  projectManagerClientManagementService.create
);

pmClientManagementRoute.put(
  '/:clientId/system-access',
  middlewares.authenticateMiddleWare,
  validators.userSystemAccessValidator,
  middlewares.validationCheckMiddleWare,
  projectManagerClientManagementService.enableOrDisableSystemAccess
);
pmClientManagementRoute.post(
  '/invite/client-user',
  middlewares.authenticateMiddleWare,
  validators.emailValidator,
  middlewares.validationCheckMiddleWare,
  projectManagerClientManagementService.inviteClientUser
);
pmClientManagementRoute.put(
  '/:clientId/update',
  middlewares.authenticateMiddleWare,
  middlewares.multerErrorHandleMiddleWare(
    middlewares.fileUploadMiddleware('images/')
  ),
  validators.colorCodeValidator,
  validators.updateImageValidators,
  middlewares.validationCheckMiddleWare,
  projectManagerClientManagementService.update
);

pmClientManagementRoute.delete(
  '/:clientId/remove',
  middlewares.authenticateMiddleWare,
  projectManagerClientManagementService.remove
);

export default pmClientManagementRoute;
