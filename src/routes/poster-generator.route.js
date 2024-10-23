import { Router } from 'express';
import * as posterGeneratorService from '../services/poster-generator.service.js';
import * as validators from '../validations/index.js';
import * as middlewares from '../middleware/index.js';

const posterGeneratorRoute = Router();

posterGeneratorRoute.get(
  '/:projectId/brand-Info/color-codes',
  middlewares.authenticateMiddleWare,
  posterGeneratorService.getBrandInfoColorCodes
);

posterGeneratorRoute.get(
  '/:projectId/brand-kit/brand-patterns',
  middlewares.authenticateMiddleWare,
  posterGeneratorService.getAllBrandPatterns
);
posterGeneratorRoute.get(
  '/:projectId/templates',
  middlewares.authenticateMiddleWare,
  posterGeneratorService.getAllTemplates
);

posterGeneratorRoute.get(
  '/:projectId/brand-info/get-watermark/get-logo',
  middlewares.authenticateMiddleWare,
  posterGeneratorService.getBrandWaterMarkandLogoImages
);

posterGeneratorRoute.post(
  '/:projectId/background-image/generate',
  middlewares.authenticateMiddleWare,
  validators.imageGenerationValidator,
  middlewares.validationCheckMiddleWare,
  posterGeneratorService.generatePosterBackgroundImages
);

posterGeneratorRoute.get(
  '/:projectId/project-documents',
  middlewares.authenticateMiddleWare,
  middlewares.validationCheckMiddleWare,
  posterGeneratorService.getProjectDocuments
);

posterGeneratorRoute.patch(
  '/:projectId/save/template',
  middlewares.authenticateMiddleWare,
  validators.saveTemplateValidator,
  middlewares.validationCheckMiddleWare,
  posterGeneratorService.saveTemplates
);

export default posterGeneratorRoute;
