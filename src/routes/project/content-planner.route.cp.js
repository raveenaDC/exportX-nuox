import { Router } from 'express';
import * as projectContentPlannerService from '../../services/project/content-planner.service-cp.js';
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
  validators.projectTypeValidator,
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

//NOT NEEDED
projectRoute.post(
  '/:projectId/content-ideas/save',
  middlewares.authenticateMiddleWare,
  validators.contentIdeasSaveValidator,
  middlewares.validationCheckMiddleWare,
  projectContentPlannerService.saveContentIdeas
);

//NOT NEEDED
projectRoute.get(
  '/:projectId/content-ideas/get',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.getContentIdeas
);

//NOT NEEDED content planner
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

// GENERATE POST
projectRoute.get(
  '/:projectId/tools/content-planner/:historyId/post-generate',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.generateSocialMediaPost
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
  '/:projectId/content-planner/creatives/:planId/image-ideas/re-generate',
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

// NEW SAVE FOR CONTENT PLANNER POST
projectRoute.post(
  '/:projectId/content-planner/save',
  middlewares.authenticateMiddleWare,
  validators.saveContentPlannerValidator,
  middlewares.validationCheckMiddleWare,
  projectContentPlannerService.saveContentPlannerPost
);


projectRoute.patch(
  '/:projectId/asset-list/:id/update',
  middlewares.authenticateMiddleWare,
  // validators.updateContentPlannerValidator,
  // middlewares.validationCheckMiddleWare,
  projectContentPlannerService.updateContentPlanner
);

//NOT NEEDED
projectRoute.get(
  '/:projectId/content-planner/creatives/:planId/:itemId',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.getContentPlannerItem
);

//generate image
projectRoute.post(
  '/:projectId/content-planner/creatives/:planId/generated-images/generate',
  middlewares.authenticateMiddleWare,
  validators.imageGenerationValidator,
  middlewares.validationCheckMiddleWare,
  projectContentPlannerService.contentPlannerItemGenerateImage
);
//delete generated image
projectRoute.delete(
  '/:projectId/content-planner/creatives/:planId/generated-images/:imageId/delete',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.contentPlannerItemDeleteGeneratedImage
);

//upload image
projectRoute.post(
  '/:projectId/content-planner/creatives/:planId/:postId/uploaded-images/upload',
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
  '/:projectId/content-planner/creatives/:planId/:postId/uploaded-images/:imageId',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.contentPlannerItemDeleteUploadImage
);

//NOT NEEDED
projectRoute.delete(
  '/:projectId/content-planner/creatives/:planId/:itemId',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.removeItemById
);

//comments
projectRoute.post(
  '/:projectId/content-planner/creatives/:planId/items/comments',
  middlewares.authenticateMiddleWare,
  validators.addCommentValidator,
  middlewares.validationCheckMiddleWare,
  projectContentPlannerService.addComment
);

projectRoute.delete(
  '/:projectId/content-planner/creatives/:planId/items/comments/:commentId/delete',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.removeComment
);

projectRoute.patch(
  '/:projectId/content-planner/creatives/:planId/status',
  middlewares.authenticateMiddleWare,
  validators.postStatusUpdateValidator,
  middlewares.validationCheckMiddleWare,
  projectContentPlannerService.updatePostStatus
);

//NOT NEEDED
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
  '/:projectId/content-planner/creatives/:planId/items/schedule',
  middlewares.authenticateMiddleWare,
  validators.dateScheduleValidator,
  middlewares.validationCheckMiddleWare,
  projectContentPlannerService.schedule
);

//NOT NEEDED
projectRoute.patch(
  '/:projectId/content-planner/creatives/bulk-action',
  middlewares.authenticateMiddleWare,
  validators.bulkActionPlannerStatusValidator,
  middlewares.validationCheckMiddleWare,
  projectContentPlannerService.bulkActionsSection
);

//NOT NEEDED
projectRoute.get(
  '/:projectId/get-filtered-items',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.getFiltersItems
);

//NOT NEEDED
projectRoute.get(
  '/content-planner/creatives/:planId/:itemId', //:projectId
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.getSocialMediaPlanContentById
);


//PROJECT TOOL CONTENT IDEA GENERATION
projectRoute.get(
  '/:projectId/tools/content-ideas/generate',
  middlewares.authenticateMiddleWare,
  validators.projectTypeValidator,
  middlewares.validationCheckMiddleWare,
  projectContentPlannerService.generateToolContentIdeas
);

//PROJECT TOOL CONTENT IDEA INDIVIDUAL SAVE
projectRoute.patch(
  '/:projectId/tools/save-content-ideas/:historyId/:language',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.saveIndividualContentIdeas
);

//PROJECT TOOL SAVE IDEAS
projectRoute.post(
  '/:projectId/tools/content-ideas/:language/save',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.saveSelectedContentIdeas
);

//PROJECT TOOL DELETE GENERATED IDEA
projectRoute.delete(
  '/:projectId/tools/content-ideas/:contentId/delete',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.deleteGeneratedContentIdea
);

// SAVE/EDIT CHILD POST
projectRoute.post(
  '/:projectId/history/:historyId/save',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.saveChildPost
);

//DELETE CHILD POST
projectRoute.delete(
  '/:projectId/history/:historyId/delete',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.deleteChildPost
);

//GET ASSET LISTS
projectRoute.get(
  '/:projectId/view/asset-lists',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.getAssetLists
);

//EDIT ASSET TITLE
projectRoute.patch(
  '/:projectId/asset/:id/title/edit',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.editAssetTitle
);

//EDIT ASSET CONTENT
projectRoute.patch(
  '/:projectId/asset/:id/edit',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.editAssetContent
);

//DELETE ASSET
projectRoute.delete(
  '/:projectId/asset/:id/delete',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.deleteAsset
);


//VIEW SINGLE POST WITH CHILD
projectRoute.get(
  '/:projectId/view/asset-lists/:id',
  middlewares.authenticateMiddleWare,
  projectContentPlannerService.getAssetListsById
);

export default projectRoute;
