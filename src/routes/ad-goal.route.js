import { Router } from 'express';
import * as adGoalService from '../services/add-goal.service.js';
import * as validators from '../validations/index.js';
import * as middlewares from '../middleware/index.js';
const addGoalRoute = Router();

addGoalRoute.get(
  '/',
  middlewares.validationCheckMiddleWare,
  // middlewares.authenticateMiddleWare,
  //middlewares.authorizeMiddleware('get-all-ad-goals'),
  adGoalService.findAll
);
addGoalRoute.get(
  '/:adGoalId',
  middlewares.authenticateMiddleWare,
  // middlewares.authorizeMiddleware('get-ad-goal'),
  adGoalService.findOne
);
addGoalRoute.post(
  '/',
  middlewares.authenticateMiddleWare,
  //middlewares.authorizeMiddleware('create-ad-goal'),
  validators.addGoalValidator,
  middlewares.validationCheckMiddleWare,
  adGoalService.create
);

addGoalRoute.patch(
  '/:adGoalId',
  middlewares.authenticateMiddleWare,
  //middlewares.authorizeMiddleware('update-ad-goal'),
  validators.addGoalValidator,
  middlewares.validationCheckMiddleWare,
  adGoalService.update
);
addGoalRoute.delete(
  '/:adGoalId',
  middlewares.authenticateMiddleWare,
  // middlewares.authorizeMiddleware('delete-ad-goal'),
  adGoalService.remove
);

export default addGoalRoute;
