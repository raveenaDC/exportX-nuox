import { Router } from 'express';
import * as userService from '../services/user.service.js';
import * as validators from '../validations/index.js';
import * as middlewares from '../middleware/index.js';

const userRoute = Router();

userRoute.get(
  '/',
  middlewares.authenticateMiddleWare,
  validators.userGetValidators,
  middlewares.validationCheckMiddleWare,
  userService.findAll
);
userRoute.get('/:id', middlewares.authenticateMiddleWare, userService.findOne);
userRoute.get(
  '/view/profile',
  middlewares.authenticateMiddleWare,
  userService.viewProfile
);

userRoute.patch(
  '/profile/update',
  middlewares.multerErrorHandleMiddleWare(
    middlewares.fileUploadMiddleware('images/')
  ),
  middlewares.authenticateMiddleWare,
  validators.userUpdatesValidator,
  middlewares.validationCheckMiddleWare,
  userService.updateProfile
);

userRoute.post(
  '/',
  middlewares.authenticateMiddleWare,
  validators.userValidator,
  middlewares.validationCheckMiddleWare,
  userService.create
);

userRoute.put(
  '/:userId/system-access',
  middlewares.authenticateMiddleWare,
  validators.userSystemAccessValidator,
  middlewares.validationCheckMiddleWare,
  userService.enableOrDisableSystemAccess
);

userRoute.patch(
  '/:id',
  middlewares.multerErrorHandleMiddleWare(
    middlewares.fileUploadMiddleware('images/')
  ),
  middlewares.authenticateMiddleWare,
  validators.userUpdatesValidator,
  middlewares.validationCheckMiddleWare,
  userService.update
);
userRoute.delete(
  '/:userId/user-image-remove',
  middlewares.authenticateMiddleWare,
  userService.userImageRemove
);
userRoute.delete(
  '/:id',
  middlewares.authenticateMiddleWare,
  userService.remove
);

export default userRoute;
