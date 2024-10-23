import { Router } from 'express';
import * as imageGenerationService from '../../services/project/image-generation.service.js';
import * as validators from '../../validations/index.js';
import * as middlewares from '../../middleware/index.js';

const imageGenerationRoute = Router();

//generate image
imageGenerationRoute.post(
  '/:projectId',
  middlewares.authenticateMiddleWare,
  validators.imageGenerationValidator,
  middlewares.validationCheckMiddleWare,
  imageGenerationService.generateNewImage
);

//remove image
imageGenerationRoute.delete(
  '/:projectId/:imageId',
  middlewares.authenticateMiddleWare,
  imageGenerationService.removeImage
);

export default imageGenerationRoute;
