import { Router } from 'express';
import * as ideaService from '../services/tools.service.js';
import * as validators from '../validations/index.js';
import * as middlewares from '../middleware/index.js';

const generateRoute = Router();

generateRoute.post(
  '/campaign-idea',
  middlewares.authenticateMiddleWare,
  validators.ideaGenerationValidator,
  middlewares.validationCheckMiddleWare,
  ideaService.generateCampaignIdea
);
generateRoute.post(
  '/creative-idea',
  middlewares.authenticateMiddleWare,
  validators.ideaGenerationValidator,
  middlewares.validationCheckMiddleWare,
  ideaService.generateCreativeIdea
);
generateRoute.post(
  '/email',
  middlewares.authenticateMiddleWare,
  validators.emailGenerationValidator,
  middlewares.validationCheckMiddleWare,
  ideaService.generateEmailContent
);

generateRoute.post(
  '/add/campaign-idea',
  middlewares.authenticateMiddleWare,
  validators.toolSaveIdeasValidator,
  middlewares.validationCheckMiddleWare,
  ideaService.saveCampaignIdea
);
generateRoute.post(
  '/add/creative-idea',
  middlewares.authenticateMiddleWare,
  validators.toolSaveIdeasValidator,
  middlewares.validationCheckMiddleWare,
  ideaService.saveCreativeIdea
);
generateRoute.post(
  '/add/email',
  middlewares.authenticateMiddleWare,
  validators.toolSaveEmailValidator,
  middlewares.validationCheckMiddleWare,
  ideaService.saveEmailContent
);

generateRoute.get(
  '/campaign-idea',
  middlewares.authenticateMiddleWare,
  ideaService.getAllSavedCampaignIdea
);

generateRoute.get(
  '/view-all/saved-prompt',
  middlewares.authenticateMiddleWare,
  ideaService.getAllSavedPrompt
);

generateRoute.get(
  '/view/saved-prompt/history/:historyId',
  middlewares.authenticateMiddleWare,
  ideaService.getSavedParentChildList
);

generateRoute.get(
  '/campaign-idea/:id',
  middlewares.authenticateMiddleWare,
  ideaService.findOneCampaignIdea
);

generateRoute.get(
  '/creative-idea',
  middlewares.authenticateMiddleWare,
  ideaService.getAllSavedCreativeIdea
);
generateRoute.get(
  '/creative-idea/:id',
  middlewares.authenticateMiddleWare,
  ideaService.findOneCreativeIdea
);

generateRoute.get(
  '/email',
  middlewares.authenticateMiddleWare,
  ideaService.getAllSavedEmail
);
generateRoute.get(
  '/email/:id',
  middlewares.authenticateMiddleWare,
  ideaService.findOneEmail
);

generateRoute.post(
  '/generate-image',
  middlewares.authenticateMiddleWare,
  validators.imageGenerationValidator,
  middlewares.validationCheckMiddleWare,
  ideaService.generatePosterImage
);
// campaignRoute.get('/:id', ideaService.findOne);
//emailRoute.patch('/:id', emailService.update);
//campaignRoute.delete('/:id', ideaService.remove);

export default generateRoute;
