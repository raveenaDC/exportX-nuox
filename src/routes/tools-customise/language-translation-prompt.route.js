import { Router } from 'express';
import * as languageTranslationPromptService from '../../services/tools-customise/language-translation-prompt.service.js';
import * as validators from '../../validations/index.js';
import * as middlewares from '../../middleware/index.js';

const languageTranslationPromptRoute = Router();

languageTranslationPromptRoute.get(
  '/list',
  middlewares.authenticateMiddleWare,
  languageTranslationPromptService.listAll
);
languageTranslationPromptRoute.post(
  '/create',
  middlewares.authenticateMiddleWare,
  validators.translateLanguagePromptValidator,
  middlewares.validationCheckMiddleWare,
  languageTranslationPromptService.addPrompt
);
languageTranslationPromptRoute.put(
  '/edit/:id',
  middlewares.authenticateMiddleWare,
  validators.translateLanguagePromptValidator,
  middlewares.validationCheckMiddleWare,
  languageTranslationPromptService.editPrompt
);
languageTranslationPromptRoute.put(
  '/:id/change-status',
  middlewares.authenticateMiddleWare,
  languageTranslationPromptService.updateStatus
);

languageTranslationPromptRoute.delete(
  '/:id/remove',
  middlewares.authenticateMiddleWare,
  languageTranslationPromptService.removePrompt
);

languageTranslationPromptRoute.post(
  '/prompt/:promptId/parent/:parentId',
  middlewares.authenticateMiddleWare,
  languageTranslationPromptService.translateIdeas
);

export default languageTranslationPromptRoute;
