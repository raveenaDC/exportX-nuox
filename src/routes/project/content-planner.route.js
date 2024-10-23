import { Router } from 'express';
import * as projectContentPlannerService from '../../services/project/content-planner.service.js';
import * as validators from '../../validations/social-media-planner/index.js';
import * as middlewares from '../../middleware/index.js';

const projectRoute = Router();

//settings
projectRoute.get(
  '/:projectId/settings',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.getSettings
);
projectRoute.post(
  '/:projectId/settings',
  middlewares.authenticateMiddleWare,
  validators.settingsValidator,
  middlewares.validationCheckMiddleWare,
  projectContentPlannerService.saveSettings
);

//feed ai
projectRoute.get(
  '/:projectId/feed-ai',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.getFeedAiDetails
);
projectRoute.post(
  '/:projectId/feed-ai',
  middlewares.authenticateMiddleWare,
  validators.feedAiValidator,
  middlewares.validationCheckMiddleWare,
  projectContentPlannerService.saveFeedAiDetails
);

//content ideas
projectRoute.get(
  '/:projectId/content-ideas/generate',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.generateContentIdeas
);

projectRoute.patch(
  '/:projectId/content-ideas/generate/more',
  middlewares.authenticateMiddleWare,
  validators.contentIdeaGenerateMoreValidator,
  middlewares.validationCheckMiddleWare,
  projectContentPlannerService.generateMoreContentIdeas
);

projectRoute.patch(
  '/:projectId/content-ideas/regenerate',
  middlewares.authenticateMiddleWare,
  validators.contentIdeaRegenerateValidator,
  middlewares.validationCheckMiddleWare,
  projectContentPlannerService.regenerateContentIdea
);

projectRoute.post(
  '/:projectId/content-ideas/save',
  middlewares.authenticateMiddleWare,
  validators.contentIdeasSaveValidator,
  middlewares.validationCheckMiddleWare,
  projectContentPlannerService.saveContentIdeas
);

projectRoute.get(
  '/:projectId/content-ideas/get',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.getContentIdeas
);

//content planner
projectRoute.get(
  '/:projectId/content-planner',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.getContentPlans
);

projectRoute.get(
  '/:projectId/content-planner/creatives/:planId/generate',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.generateCreatives
);

projectRoute.get(
  '/:projectId/content-planner/creatives/:planId/:platform/generate',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.generateSinglePost
);

projectRoute.patch(
  '/:projectId/content-planner/creatives/:planId/:platform/regenerate',
  middlewares.authenticateMiddleWare,
  validators.singlePostRegenerateValidator,
  middlewares.validationCheckMiddleWare,
  projectContentPlannerService.regenerateSinglePost
);

projectRoute.patch(
  '/:projectId/content-planner/creatives/:planId/:itemId/image-ideas/re-generate',
  middlewares.authenticateMiddleWare,
  validators.imageIdeasRegenerateValidator,
  middlewares.validationCheckMiddleWare,
  projectContentPlannerService.regenerateImageIdeas
);

projectRoute.patch(
  '/:projectId/content-planner/creatives/:planId/dalle-prompt/re-generate',
  middlewares.authenticateMiddleWare,
  validators.dallePromptRegenerateValidator,
  middlewares.validationCheckMiddleWare,
  projectContentPlannerService.regenerateDallePrompt
);

projectRoute.post(
  '/:projectId/content-planner/creatives/:planId/save',
  middlewares.authenticateMiddleWare,
  validators.saveContentPlannerValidator,
  middlewares.validationCheckMiddleWare,
  projectContentPlannerService.saveContentPlanner
);

projectRoute.get(
  '/:projectId/content-planner/creatives/:planId/:itemId',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.getContentPlannerItem
);

//generate image
projectRoute.post(
  '/:projectId/content-planner/creatives/:planId/:itemId/generated-images/generate',
  middlewares.authenticateMiddleWare,
  validators.imageGenerationValidator,
  middlewares.validationCheckMiddleWare,
  projectContentPlannerService.contentPlannerItemGenerateImage
);
//delete generated image
projectRoute.delete(
  '/:projectId/content-planner/creatives/:planId/:itemId/generated-images/:imageId',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.contentPlannerItemDeleteGeneratedImage
);

//upload image
projectRoute.post(
  '/:projectId/content-planner/creatives/:planId/:itemId/:postId/uploaded-images/upload',
  middlewares.authenticateMiddleWare,
  middlewares.multerErrorHandleMiddleWare(
    middlewares.fileUploadMiddleware('images/')
  ),
  validators.imageUploadValidator,
  middlewares.validationCheckMiddleWare,
  projectContentPlannerService.contentPlannerItemUploadImage
);
//remove uploaded image
projectRoute.delete(
  '/:projectId/content-planner/creatives/:planId/:itemId/:postId/uploaded-images/:imageId',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.contentPlannerItemDeleteUploadImage
);

projectRoute.delete(
  '/:projectId/content-planner/creatives/:planId/:itemId',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.removeItemById
);

//comments
projectRoute.post(
  '/:projectId/content-planner/creatives/:planId/:itemId/comments',
  middlewares.authenticateMiddleWare,
  validators.addCommentValidator,
  middlewares.validationCheckMiddleWare,
  projectContentPlannerService.addComment
);

projectRoute.delete(
  '/:projectId/content-planner/creatives/:planId/:itemId/comments/:commentId',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.removeComment
);

projectRoute.patch(
  '/:projectId/content-planner/creatives/:planId/:itemId/status',
  middlewares.authenticateMiddleWare,
  validators.postStatusUpdateValidator,
  middlewares.validationCheckMiddleWare,
  projectContentPlannerService.updatePostStatus
);

projectRoute.patch(
  '/content-planner/creatives/:planId/:itemId',
  middlewares.authenticateMiddleWare,
  validators.editContentPlannerValidator,
  middlewares.validationCheckMiddleWare,
  projectContentPlannerService.editSocialMediaContentPlanner
);

projectRoute.get(
  '/content-planner/creatives/:planId',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.getSocialMediaPlannerById
);

projectRoute.post(
  '/:projectId/content-planner/creatives/:planId/:itemId/schedule',
  middlewares.authenticateMiddleWare,
  validators.dateScheduleValidator,
  middlewares.validationCheckMiddleWare,
  projectContentPlannerService.schedule
);

projectRoute.patch(
  '/:projectId/content-planner/creatives/bulk-action',
  middlewares.authenticateMiddleWare,
  validators.bulkActionPlannerStatusValidator,
  middlewares.validationCheckMiddleWare,
  projectContentPlannerService.bulkActionsSection
);

projectRoute.get(
  '/:projectId/get-filtered-items',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.getFiltersItems
);

projectRoute.get(
  '/content-planner/creatives/:planId/:itemId',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.getSocialMediaPlanContentById
);

export default projectRoute;
