import { Router } from 'express';
import * as projectUserManagementService from '../../services/project/user-management.service.js';
import * as validators from '../../validations/index.js';
import * as middlewares from '../../middleware/index.js';

const userManagementRoute = Router();

//add new project assignee to project
userManagementRoute.patch(
  '/:projectId/user-management/project-assignees',
  middlewares.authenticateMiddleWare,
  validators.projectUserManagementValidator,
  middlewares.validationCheckMiddleWare,
  projectUserManagementService.addProjectAssignee
);

//make user project manager
userManagementRoute.patch(
  '/:projectId/user-management/make-project-manager',
  middlewares.authenticateMiddleWare,
  validators.projectUserManagementValidator,
  middlewares.validationCheckMiddleWare,
  projectUserManagementService.makeProjectManager
);

//make user client coordinator
userManagementRoute.patch(
  '/:projectId/user-management/make-client-coordinator',
  middlewares.authenticateMiddleWare,
  validators.projectUserManagementValidator,
  middlewares.validationCheckMiddleWare,
  projectUserManagementService.makeClientCoordinator
);
//remove project assignee from project
userManagementRoute.delete(
  '/:projectId/user-management/project-assignees/:userId',
  middlewares.authenticateMiddleWare,
  projectUserManagementService.removeProjectAssignee
);

//get all the project coordinators inside a project
userManagementRoute.get(
  '/:projectId/user-management/project-assignees',
  middlewares.authenticateMiddleWare,
  projectUserManagementService.getProjectCoordinators
);
//get all the users inside a project
userManagementRoute.get(
  '/:projectId/user-management/client-users/get-all',
  middlewares.authenticateMiddleWare,
  projectUserManagementService.getClientUsers
);
//add new client user to project
userManagementRoute.patch(
  '/:projectId/user-management/client-users',
  middlewares.authenticateMiddleWare,
  validators.projectUserManagementValidator,
  middlewares.validationCheckMiddleWare,
  projectUserManagementService.addClientUser
);

//remove client user from project
userManagementRoute.delete(
  '/:projectId/user-management/client-users/:userId',
  middlewares.authenticateMiddleWare,
  projectUserManagementService.removeClientUser
);

//get client user from project
userManagementRoute.get(
  '/:projectId/user-management/client-users',
  middlewares.authenticateMiddleWare,
  projectUserManagementService.getClientAssignees
);

export default userManagementRoute;
