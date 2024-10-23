import { Router } from 'express';
import * as projectDiscussionService from '../../../services/dashboard-service/client-dashboard/discussion.service.js';
import * as validators from '../../../validations/index.js';
import * as middlewares from '../../../middleware/index.js';

const discussionForumRoute = Router();

//create discussion
discussionForumRoute.post(
  '/:projectId/discussion-forum',
  middlewares.authenticateMiddleWare,
  validators.discussionValidator,
  middlewares.validationCheckMiddleWare,
  projectDiscussionService.createDiscussion
);

//update discussion
discussionForumRoute.patch(
  '/:projectId/discussion-forum/:discussionId',
  middlewares.authenticateMiddleWare,
  validators.discussionValidator,
  middlewares.validationCheckMiddleWare,
  projectDiscussionService.updateDiscussion
);

//get discussions
discussionForumRoute.get(
  '/:projectId/discussion-forum',
  middlewares.authenticateMiddleWare,
  projectDiscussionService.getDiscussions
);

//get discussion
discussionForumRoute.get(
  '/:projectId/discussion-forum/:discussionId',
  middlewares.authenticateMiddleWare,
  projectDiscussionService.getDiscussionById
);

//delete discussion
discussionForumRoute.delete(
  '/:projectId/discussion-forum/:discussionId',
  middlewares.authenticateMiddleWare,
  projectDiscussionService.removeDiscussion
);

//upload Image

// discussionForumRoute.post(
//   '/image-upload',
//   middlewares.multerErrorHandleMiddleWare(
//     middlewares.fileUploadMiddleware('discussions/')
//   ),
//   validators.dicussionImageUploadValidator,
//   middlewares.authenticateMiddleWare,
//   projectDiscussionService.discussionImageUpload
// );

export default discussionForumRoute;
