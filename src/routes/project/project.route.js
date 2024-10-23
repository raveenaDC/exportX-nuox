import { Router } from 'express';
import * as projectService from '../../services/project/project.service.js';
import * as projectDiscussionService from '../../services/project/discussion.service.js';
import * as validators from '../../validations/index.js';
import * as middlewares from '../../middleware/index.js';

const projectRoute = Router();

//get all clients
projectRoute.get(
  '/clients',
  middlewares.authenticateMiddleWare,
  projectService.getClients
);

//get client users
projectRoute.get(
  '/:clientId/client-users',
  middlewares.authenticateMiddleWare,
  projectService.getClientUsers
);

//get client users
projectRoute.get(
  '/project-users',
  middlewares.authenticateMiddleWare,
  projectService.getProjectUsers
);

//create project
projectRoute.post(
  '/',
  middlewares.authenticateMiddleWare,
  validators.projectCreateValidator,
  middlewares.validationCheckMiddleWare,
  projectService.create
);

//update  project over view
projectRoute.patch(
  '/:projectId/project-overview',
  middlewares.authenticateMiddleWare,
  validators.projectOverviewUpdateValidator,
  middlewares.validationCheckMiddleWare,
  projectService.updateProjectOverView
);

//get projects
projectRoute.get(
  '/',
  validators.projectGetValidator,
  middlewares.validationCheckMiddleWare,
  middlewares.authenticateMiddleWare,
  projectService.findAll
);

//filter projects
projectRoute.get(
  '/filter',
  middlewares.authenticateMiddleWare,
  validators.projectFilterValidator,
  middlewares.validationCheckMiddleWare,
  projectService.filter
);
//get project
projectRoute.get(
  '/:projectId',
  middlewares.authenticateMiddleWare,
  projectService.findOne
);

//update status
projectRoute.patch(
  '/:projectId/status-update',
  middlewares.authenticateMiddleWare,
  validators.projectStatusUpdateValidator,
  middlewares.validationCheckMiddleWare,
  projectService.updateStatus
);

export default projectRoute;
