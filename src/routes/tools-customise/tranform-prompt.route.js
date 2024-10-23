import { Router } from 'express';
import * as transformPromptService from '../../services/tools-customise/transform-prompt.service.js';
import * as validators from '../../validations/index.js';
import * as middlewares from '../../middleware/index.js';

const transformPromptRoute = Router();

transformPromptRoute.get(
  '/list',
  middlewares.authenticateMiddleWare,
  transformPromptService.listAll
);
transformPromptRoute.post(
  '/prompt/:promptId/parent/:parentId',
  middlewares.authenticateMiddleWare,
  transformPromptService.transformIdeas
);

transformPromptRoute.post(
  '/create',
  middlewares.authenticateMiddleWare,
  validators.transformPromptValidator,
  middlewares.validationCheckMiddleWare,
  transformPromptService.createPrompt
);
transformPromptRoute.put(
  '/edit/:id',
  middlewares.authenticateMiddleWare,
  validators.transformPromptValidator,
  middlewares.validationCheckMiddleWare,
  transformPromptService.editPrompt
);
transformPromptRoute.put(
  '/:id/change-status',
  middlewares.authenticateMiddleWare,
  transformPromptService.updateStatus
);

transformPromptRoute.delete(
  '/:id/remove',
  middlewares.authenticateMiddleWare,
  transformPromptService.removePrompt
);
export default transformPromptRoute;
