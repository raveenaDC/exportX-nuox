import { Router } from 'express';
import * as customPromptService from '../../services/tools-customise/custom-prompt.service.js';
import * as validators from '../../validations/index.js';
import * as middlewares from '../../middleware/index.js';

const customPromptRoute = Router();
customPromptRoute.post(
  '/parent/:parentId/generate',
  middlewares.authenticateMiddleWare,
  customPromptService.GenerateIdeas
);

customPromptRoute.get(
  '/',
  middlewares.authenticateMiddleWare,
  customPromptService.listAll
);

export default customPromptRoute;
