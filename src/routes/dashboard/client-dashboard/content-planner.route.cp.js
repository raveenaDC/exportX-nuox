import { Router } from 'express';
import * as projectContentPlannerService from '../../../services/dashboard-service/client-dashboard/content-planner.service-cp.js';
import * as validators from '../../../validations/index.js';
import * as middlewares from '../../../middleware/index.js';

const clientDashboardContentPlannerRoute = Router();

//generate content plans
// clientDashboardContentPlannerRoute.get(
//   '/:projectId/social-media-planner',
//   middlewares.authenticateMiddleWare,
//   validators.socialMediaPostStatusValidator,
//   middlewares.validationCheckMiddleWare,
//   projectContentPlannerService.getSocialMediaPlanner
// );
clientDashboardContentPlannerRoute.get(
  '/:projectId/social-media-planner/filtered-items',
  //middlewares.clientAuthorizeMiddleware('get-filter-items'),
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.getFiltersItems
);

clientDashboardContentPlannerRoute.get(
  '/social-media-planner/:planId',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.getSocialMediaPlannerById
);

clientDashboardContentPlannerRoute.get(
  '/social-media-planner/:planId/:itemId',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.getSocialMediaPlanContentById
);

// socialMediaPostRoute.patch(
//   '/social-media-post/:postId/schedule',
//   middlewares.authenticateMiddleWare,
//   projectContentPlannerService.setScheduleDate
// );
clientDashboardContentPlannerRoute.patch(
  '/:projectId/social-media-planner/bulk-action',
  middlewares.authenticateMiddleWare,
  validators.bulkActionPosterStatusValidator,
  middlewares.validationCheckMiddleWare,
  projectContentPlannerService.setBulkAction
);

//update status
clientDashboardContentPlannerRoute.patch(
  '/:projectId/social-media-planner/:planId/:itemId/status',
  middlewares.authenticateMiddleWare,
  validators.clientPostStatusUpdateValidator,
  middlewares.validationCheckMiddleWare,
  projectContentPlannerService.updatePostStatus
);

//add comment
clientDashboardContentPlannerRoute.post(
  '/:projectId/social-media-planner/:planId/:itemId/add/comment',
  middlewares.authenticateMiddleWare,
  validators.addPostCommentValidator,
  middlewares.validationCheckMiddleWare,
  projectContentPlannerService.addComment
);

clientDashboardContentPlannerRoute.delete(
  '/:projectId/social-media-planner/:planId/:itemId/comment/:commentId',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.deleteComment
);
export default clientDashboardContentPlannerRoute;
