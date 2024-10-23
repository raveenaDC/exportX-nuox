import { Router } from 'express';
import * as projectManagerDashboardService from '../../../services/dashboard-service/project-manager-dashboard/project-manager-dashboard.service.js';
import * as validators from '../../../validations/index.js';
import * as middlewares from '../../../middleware/index.js';

const projectManagerDashboardRoute = Router();

projectManagerDashboardRoute.get(
  '/view-all-details',
  //middlewares.authenticateMiddleWare,
  projectManagerDashboardService.findAllDetails
);

projectManagerDashboardRoute.get(
  '/projects/view-all',
  // middlewares.authenticateMiddleWare,
  projectManagerDashboardService.viewAllProjects
);

projectManagerDashboardRoute.get(
  '/tasks/view-all',
  // middlewares.authenticateMiddleWare,
  projectManagerDashboardService.viewAllTasks
);

projectManagerDashboardRoute.patch(
  '/projects/:projectId/update-status',
  // middlewares.authenticateMiddleWare,
  validators.projectStatusUpdateValidator,
  middlewares.validationCheckMiddleWare,
  projectManagerDashboardService.updateProjectStatus
);

projectManagerDashboardRoute.patch(
  '/:projectId/tasks/:taskId/update-status',
  // middlewares.authenticateMiddleWare,
  validators.taskStatusUpdateValidator,
  middlewares.validationCheckMiddleWare,
  projectManagerDashboardService.updateTaskStatus
);

export default projectManagerDashboardRoute;
