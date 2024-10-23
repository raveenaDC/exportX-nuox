import { Router } from 'express';
import * as clientDashboardService from '../../../services/dashboard-service/client-dashboard/client-dashboard.service.js';
import * as validators from '../../../validations/index.js';
import * as middlewares from '../../../middleware/index.js';

const clientDashboardRoute = Router();

clientDashboardRoute.get(
  '/view-projects',
  middlewares.authenticateMiddleWare,
  validators.clientDashboardProjectValidator,
  middlewares.validationCheckMiddleWare,
  clientDashboardService.findAllProjects
);
clientDashboardRoute.get(
  '/projects',
  middlewares.authenticateMiddleWare,
  validators.clientDashboardScheduleValidator,
  validators.clientDashboardProjectValidator,
  middlewares.validationCheckMiddleWare,
  clientDashboardService.findProjects
);
clientDashboardRoute.get(
  '/projects/:projectId',
  middlewares.authenticateMiddleWare,
  clientDashboardService.findProjectById
);
export default clientDashboardRoute;
