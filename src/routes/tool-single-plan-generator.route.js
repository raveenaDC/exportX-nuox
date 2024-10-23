import { Router } from 'express';
import * as toolSinglePlanGeneratorService from '../services/tool-single-plan-generator.service.js';
import * as validators from '../validations/tool-single-plan-generator/index.js';
import * as middlewares from '../middleware/index.js';

const toolSinglePlanGenerateRoute = Router();

toolSinglePlanGenerateRoute.get(
  '/projects',
  middlewares.authenticateMiddleWare,
  toolSinglePlanGeneratorService.findAllProjects
);

toolSinglePlanGenerateRoute.get(
  '/projects/:projectId/settings',
  middlewares.authenticateMiddleWare,
  toolSinglePlanGeneratorService.getProjectSettings
);

toolSinglePlanGenerateRoute.patch(
  '/tag-ideas',
  middlewares.authenticateMiddleWare,
  validators.tagIdeasGenerateValidator,
  middlewares.validationCheckMiddleWare,
  toolSinglePlanGeneratorService.generateTagIdeas
);

toolSinglePlanGenerateRoute.post(
  '/settings',
  middlewares.authenticateMiddleWare,
  validators.settingsSaveValidator,
  middlewares.validationCheckMiddleWare,
  toolSinglePlanGeneratorService.saveSettings
);

toolSinglePlanGenerateRoute.get(
  '/:planId/content-ideas/generate',
  middlewares.authenticateMiddleWare,
  toolSinglePlanGeneratorService.generateContentIdeas
);

toolSinglePlanGenerateRoute.patch(
  '/:planId/content-ideas/generate/more',
  middlewares.authenticateMiddleWare,
  validators.contentIdeaGenerateMoreValidator,
  middlewares.validationCheckMiddleWare,
  toolSinglePlanGeneratorService.generateMoreContentIdeas
);

toolSinglePlanGenerateRoute.patch(
  '/:planId/content-ideas/regenerate',
  middlewares.authenticateMiddleWare,
  validators.contentIdeaRegenerateValidator,
  middlewares.validationCheckMiddleWare,
  toolSinglePlanGeneratorService.regenerateContentIdea
);

toolSinglePlanGenerateRoute.post(
  '/:planId/content-ideas',
  middlewares.authenticateMiddleWare,
  validators.contentIdeasSaveValidator,
  middlewares.validationCheckMiddleWare,
  toolSinglePlanGeneratorService.saveContentIdeas
);

toolSinglePlanGenerateRoute.get(
  '/:planId/content-ideas',
  middlewares.authenticateMiddleWare,
  toolSinglePlanGeneratorService.getContentIdeas
);
toolSinglePlanGenerateRoute.get(
  '/:planId/generate',
  middlewares.authenticateMiddleWare,
  toolSinglePlanGeneratorService.generatePlan
);

toolSinglePlanGenerateRoute.get(
  '/:planId/:platform/add-more',
  middlewares.authenticateMiddleWare,
  toolSinglePlanGeneratorService.addMoreMost
);
toolSinglePlanGenerateRoute.post(
  '/:planId',
  middlewares.authenticateMiddleWare,
  validators.planSaveValidator,
  middlewares.validationCheckMiddleWare,
  toolSinglePlanGeneratorService.savePlan
);

toolSinglePlanGenerateRoute.patch(
  '/:planId/generated-images/generate',
  middlewares.authenticateMiddleWare,
  validators.imageGenerationValidator,
  middlewares.validationCheckMiddleWare,
  toolSinglePlanGeneratorService.generateAiImage
);

toolSinglePlanGenerateRoute.delete(
  '/:planId/generated-images/:imageId',
  middlewares.authenticateMiddleWare,
  toolSinglePlanGeneratorService.removeGeneratedImage
);

toolSinglePlanGenerateRoute.patch(
  '/:planId/image-ideas/regenerate',
  middlewares.authenticateMiddleWare,
  validators.imageIdeasRegenerateValidator,
  middlewares.validationCheckMiddleWare,
  toolSinglePlanGeneratorService.regenerateImageIdea
);

toolSinglePlanGenerateRoute.patch(
  '/:planId/dalle-prompt/regenerate',
  middlewares.authenticateMiddleWare,
  validators.dallePromptRegenerateValidator,
  middlewares.validationCheckMiddleWare,
  toolSinglePlanGeneratorService.regenerateDallePrompt
);

toolSinglePlanGenerateRoute.post(
  '/',
  middlewares.authenticateMiddleWare,
  toolSinglePlanGeneratorService.savePlan
);

toolSinglePlanGenerateRoute.post(
  '/:planId/uploaded-images/:postId',
  // middlewares.authenticateMiddleWare,
  middlewares.multerErrorHandleMiddleWare(
    middlewares.fileUploadMiddleware('images/')
  ),
  validators.imageUploadValidator,
  middlewares.validationCheckMiddleWare,
  toolSinglePlanGeneratorService.uploadImage
);

toolSinglePlanGenerateRoute.delete(
  '/:planId/uploaded-images/:postId/:imageId',
  middlewares.authenticateMiddleWare,
  toolSinglePlanGeneratorService.removeUploadedImage
);

toolSinglePlanGenerateRoute.get(
  '/',
  middlewares.authenticateMiddleWare,
  toolSinglePlanGeneratorService.getPlans
);

toolSinglePlanGenerateRoute.get(
  '/:planId',
  middlewares.authenticateMiddleWare,
  toolSinglePlanGeneratorService.getPlan
);

export default toolSinglePlanGenerateRoute;
