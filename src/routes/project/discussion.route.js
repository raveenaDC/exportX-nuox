import { Router } from 'express';
import * as projectDiscussionService from '../../services/project/discussion.service.js';
import * as validators from '../../validations/index.js';
import * as middlewares from '../../middleware/index.js';

const projectRoute = Router();

//create discussion
projectRoute.post(
  '/:projectId/discussion-forum',
  middlewares.authenticateMiddleWare,
  validators.discussionValidator,
  middlewares.validationCheckMiddleWare,
  projectDiscussionService.createDiscussion
);

//update discussion
projectRoute.patch(
  '/:projectId/discussion-forum/:discussionId',
  middlewares.authenticateMiddleWare,
  validators.discussionValidator,
  middlewares.validationCheckMiddleWare,
  projectDiscussionService.updateDiscussion
);

//get discussions
projectRoute.get(
  '/:projectId/discussion-forum',
  middlewares.authenticateMiddleWare,
  projectDiscussionService.getDiscussions
);

//get discussion
projectRoute.get(
  '/:projectId/discussion-forum/:discussionId',
  middlewares.authenticateMiddleWare,
  projectDiscussionService.getDiscussion
);

//delete discussion
projectRoute.delete(
  '/:projectId/discussion-forum/:discussionId',
  middlewares.authenticateMiddleWare,
  projectDiscussionService.removeDiscussion
);

//upload Image

projectRoute.post(
  '/image-upload',
  middlewares.authenticateMiddleWare,
  middlewares.multerErrorHandleMiddleWare(
    middlewares.fileUploadMiddleware('discussions/')
  ),
  validators.dicussionImageUploadValidator,
  middlewares.validationCheckMiddleWare,
  projectDiscussionService.discussionImageUpload
);

projectRoute.post(
  '/video/upload',
  middlewares.authenticateMiddleWare,
  middlewares.multerErrorHandleMiddleWare(
    middlewares.fileUploadMiddleware('videos/', 'video')
  ),
  validators.discussionVideoUploadValidator,
  middlewares.validationCheckMiddleWare,
  projectDiscussionService.discussionVideoUpload
);

projectRoute.get(
  '/:projectId/fetch-members',
  middlewares.authenticateMiddleWare,
  projectDiscussionService.mentionUsers
);

export default projectRoute;
