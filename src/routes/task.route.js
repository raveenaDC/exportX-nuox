import { Router } from 'express';
import * as taskService from '../services/task.service.js';
import * as validators from '../validations/index.js';
import * as middlewares from '../middleware/index.js';

const taskRoute = Router();

taskRoute.get(
  '/:projectId',
  middlewares.authenticateMiddleWare,
  // middlewares.authorizeMiddleware('get-all-tasks'),
  taskService.findAll
);

taskRoute.get(
  '/:projectId/assignees/get-all',
  middlewares.authenticateMiddleWare,
  // middlewares.authorizeMiddleware('get-all-tasks'),
  taskService.getAssignees
);

taskRoute.get(
  '/projects/get-all',
  middlewares.authenticateMiddleWare,
  // middlewares.authorizeMiddleware('get-all-tasks'),
  taskService.getProjects
);

taskRoute.get(
  '/:projectId/:taskId',
  middlewares.authenticateMiddleWare,
  // middlewares.authorizeMiddleware('get-task'),
  taskService.findOne
);

taskRoute.post(
  '/',
  middlewares.authenticateMiddleWare,
  // middlewares.authorizeMiddleware('create-task'),
  validators.taskValidator,
  middlewares.validationCheckMiddleWare,
  taskService.create
);

taskRoute.patch(
  '/:projectId/:taskId',
  middlewares.authenticateMiddleWare,
  // middlewares.authorizeMiddleware('update-task'),
  validators.taskUpdateValidator,
  middlewares.validationCheckMiddleWare,
  taskService.update
);

taskRoute.delete(
  '/:projectId/:taskId',
  middlewares.authenticateMiddleWare,
  // middlewares.authorizeMiddleware('delete-task'),
  taskService.remove
);

taskRoute.put(
  '/:projectId/:taskId/status',
  middlewares.authenticateMiddleWare,
  //middlewares.authorizeMiddleware('update-task-stage'),
  validators.taskStatusUpdateValidator,
  middlewares.validationCheckMiddleWare,
  taskService.updateStatus
);

taskRoute.get(
  '/:projectId/:taskId/send-for-approval',
  middlewares.authenticateMiddleWare,
  //middlewares.authorizeMiddleware('update-task-stage'),
  // validators.taskStageUpdateValidator,
  // middlewares.validationCheckMiddleWare,
  taskService.sendForApproval
);

//not in usee
// taskRoute.put(
//   '/:projectId/:taskId/approve',
//   middlewares.authenticateMiddleWare,
//   // middlewares.authorizeMiddleware('approve-or-reject-task'),
//   validators.taskApproveValidator,
//   middlewares.validationCheckMiddleWare,
//   taskService.approve
// );

taskRoute.put(
  '/:projectId/bulk-actions',
  middlewares.authenticateMiddleWare,
  // middlewares.authorizeMiddleware('approve-or-reject-task'),
  validators.taskBulkActionValidator,
  middlewares.validationCheckMiddleWare,
  taskService.bulkAction
);

export default taskRoute;
