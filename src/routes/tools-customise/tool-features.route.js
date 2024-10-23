import { Router } from 'express';
import * as toolFeaturesService from '../../services/tools-customise/tool-features.service.js';
import * as validators from '../../validations/index.js';
import * as middlewares from '../../middleware/index.js';

const toolFeaturesRoute = Router();
toolFeaturesRoute.put(
  '/prompt-history/:promptHistoryId/content/edit',
  middlewares.authenticateMiddleWare,
  toolFeaturesService.editAndSaveHistoryContent
);

toolFeaturesRoute.patch(
  '/prompt-history/:historyId/rename',
  middlewares.authenticateMiddleWare,
  toolFeaturesService.renameHistoryName
);
toolFeaturesRoute.delete(
  '/prompt-history/:historyId/remove',
  middlewares.authenticateMiddleWare,
  toolFeaturesService.removeHistory
);
toolFeaturesRoute.get(
  '/history/list',
  middlewares.authenticateMiddleWare,
  toolFeaturesService.listAllResponseHistory
);
toolFeaturesRoute.get(
  '/history/:id/get',
  middlewares.authenticateMiddleWare,
  toolFeaturesService.individualHistoryContentViewIcon
);
toolFeaturesRoute.get(
  '/parent/:parentId/get',
  middlewares.authenticateMiddleWare,
  toolFeaturesService.getParentChildHistoryResponse
);

toolFeaturesRoute.patch(
  '/saved-idea/history/:historyId/rename',
  middlewares.authenticateMiddleWare,
  toolFeaturesService.renameSavedContentTitle
);
toolFeaturesRoute.patch(
  '/saved-idea/history/:historyId/edit',
  middlewares.authenticateMiddleWare,
  toolFeaturesService.editSavedContent
);
toolFeaturesRoute.delete(
  '/saved-idea/:id/delete',
  middlewares.authenticateMiddleWare,
  toolFeaturesService.deleteSavedContent
);
toolFeaturesRoute.get(
  '/saved-idea/:id',
  middlewares.authenticateMiddleWare,
  toolFeaturesService.individualSavedContentViewIcon
);
export default toolFeaturesRoute;
