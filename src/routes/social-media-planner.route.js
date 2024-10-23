import { Router } from 'express';
import * as socialMediaPlannerService from '../services/social-media-planner.service.js';
import * as validators from '../validations/index.js';
import * as middlewares from '../middleware/index.js';
const socialMediaPlannerRoute = Router();

socialMediaPlannerRoute.get(
  '/clients',
  middlewares.authenticateMiddleWare,
  socialMediaPlannerService.getAllClients
);

socialMediaPlannerRoute.get(
  '/clients/:clientId/projects',
  middlewares.authenticateMiddleWare,
  socialMediaPlannerService.getProjectsByClientId
);

socialMediaPlannerRoute.get(
  '/projects/:projectId/planner-contents',
  middlewares.authenticateMiddleWare,
  socialMediaPlannerService.getAllSocialMediaContents
);

socialMediaPlannerRoute.patch(
  '/:projectId/content-planner/:planId/:itemId/status',
  middlewares.authenticateMiddleWare,
  validators.postStatusUpdateValidator,
  middlewares.validationCheckMiddleWare,
  socialMediaPlannerService.updateItemStatus
);

socialMediaPlannerRoute.post(
  '/:projectId/content-planner/:planId/:itemId/schedule',
  middlewares.authenticateMiddleWare,
  validators.dateScheduleValidator,
  middlewares.validationCheckMiddleWare,
  socialMediaPlannerService.schedule
);

socialMediaPlannerRoute.patch(
  '/:projectId/bulk-action',
  middlewares.authenticateMiddleWare,
  validators.bulkActionPlannerStatusValidator,
  middlewares.validationCheckMiddleWare,
  socialMediaPlannerService.setBulkAction
);

export default socialMediaPlannerRoute;
