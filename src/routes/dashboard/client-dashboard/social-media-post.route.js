import { Router } from 'express';
import * as projectContentPlannerService from '../../../services/dashboard-service/client-dashboard/content-planner.service.js';
import * as validators from '../../../validations/index.js';
import * as middlewares from '../../../middleware/index.js';

const socialMediaPostRoute = Router();

//generate content plans
socialMediaPostRoute.get(
  '/:projectId/social-media/post',
  middlewares.authenticateMiddleWare,
  validators.socialMediaPostStatusValidator,
  middlewares.validationCheckMiddleWare,
  projectContentPlannerService.getSocialMediaPlanner
);

socialMediaPostRoute.get(
  '/social-media-post/:postId',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.getSocialMediaPlannerById
);

socialMediaPostRoute.get(
  '/social-media-post/:postId/content/:contentId',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.getSocialMediaPlanContentById
);

// socialMediaPostRoute.patch(
//   '/social-media-post/:postId/schedule',
//   middlewares.authenticateMiddleWare,
//   projectContentPlannerService.setScheduleDate
// );
socialMediaPostRoute.patch(
  '/social-media-post/bulk-action',
  middlewares.authenticateMiddleWare,
  validators.bulkActionPosterStatusValidator,
  middlewares.validationCheckMiddleWare,
  projectContentPlannerService.setBulkAction
);

//update status
socialMediaPostRoute.patch(
  '/:projectId/posts/:postId/:contentId/approve-status',
  middlewares.authenticateMiddleWare,
  validators.clientPostStatusUpdateValidator,
  middlewares.validationCheckMiddleWare,
  projectContentPlannerService.updatePostStatus
);

//add comment
socialMediaPostRoute.post(
  '/:projectId/posts/:postId/:contentId/add/comment',
  middlewares.authenticateMiddleWare,
  validators.addPostCommentValidator,
  middlewares.validationCheckMiddleWare,
  projectContentPlannerService.addComment
);

socialMediaPostRoute.delete(
  '/:projectId/posts/:postId/:contentId/comment/:commentId',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.deleteComment
);
export default socialMediaPostRoute;
