import { Router } from 'express';
import * as designationService from '../services/user-designation.service.js';
import * as validators from '../validations/index.js';
import * as middlewares from '../middleware/index.js';
const addDesignation = Router();

addDesignation.get(
  '/',
  middlewares.authenticateMiddleWare,
  //middlewares.authorizeMiddleware('get-all-designation'),
  designationService.findAll
);
addDesignation.get(
  '/active',
  middlewares.authenticateMiddleWare,
  //middlewares.authorizeMiddleware('get-active-designation'),
  designationService.findAllActiveDesignation
);
addDesignation.post(
  '/',
  middlewares.authenticateMiddleWare,
  //middlewares.authorizeMiddleware('create-designation'),
  validators.userDesignationValidator,
  middlewares.validationCheckMiddleWare,
  designationService.create
);
addDesignation.patch(
  '/:id',
  middlewares.authenticateMiddleWare,
  //middlewares.authorizeMiddleware('update-designation'),
  validators.userDesignationValidator,
  middlewares.validationCheckMiddleWare,
  designationService.update
);
addDesignation.patch(
  '/:id/status',
  middlewares.authenticateMiddleWare,
  //middlewares.authorizeMiddleware('update-status'),
  validators.activationStatusValidator,
  middlewares.validationCheckMiddleWare,
  designationService.updateStatus
);
addDesignation.delete(
  '/:id',
  middlewares.authenticateMiddleWare,
  // middlewares.authorizeMiddleware('delete-designation'),
  designationService.remove
);

export default addDesignation;
