import { Router } from 'express';
import * as promptsService from '../services/prompts.service.js';
import * as validators from '../validations/index.js';
import * as middlewares from '../middleware/index.js';

const promptsRoute = Router();

promptsRoute.get(
  '/',
  middlewares.authenticateMiddleWare,
  promptsService.findAll
);
promptsRoute.get(
  '/:promptId',
  middlewares.authenticateMiddleWare,
  promptsService.findOne
);
promptsRoute.post(
  '/',
  middlewares.authenticateMiddleWare,
  validators.promptsValidator,
  middlewares.validationCheckMiddleWare,
  promptsService.create
);

promptsRoute.patch(
  '/:promptId',
  middlewares.authenticateMiddleWare,
  validators.promptUpdateValidator,
  middlewares.validationCheckMiddleWare,
  promptsService.update
);

promptsRoute.get(
  '/history/find',
  middlewares.authenticateMiddleWare,
  promptsService.findAllPromptHistory
);
promptsRoute.get(
  '/history/:id',
  middlewares.authenticateMiddleWare,
  promptsService.findPromptHistory
);
export default promptsRoute;
