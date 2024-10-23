import { Router } from 'express';
import * as authService from '../services/auth.service.js';
import * as validators from '../validations/index.js';
import * as middlewares from '../middleware/index.js';
const authRoute = Router();
import { generateJwtToken } from '../utils/encryption.helper.js';

authRoute.post(
  '/login',
  validators.loginValidator,
  middlewares.validationCheckMiddleWare,
  authService.login
);

authRoute.post(
  '/update-password',
  middlewares.authenticateMiddleWare,
  validators.updatePasswordValidator,
  middlewares.validationCheckMiddleWare,
  authService.updatePassword
);

//reset password 1 step
authRoute.get(
  '/:email/send-forgot-password-mail',
  validators.sendForgotPasswordMailValidator,
  middlewares.validationCheckMiddleWare,
  authService.sendForgotPasswordMail
);
//reset password 2 step
authRoute.post(
  '/reset-password',
  validators.resetPasswordValidator,
  middlewares.validationCheckMiddleWare,
  authService.resetPassword
);

authRoute.delete(
  '/logout',
  middlewares.authenticateMiddleWare,
  authService.logout
);

authRoute.post('/google', authService.loginWithGoogle);

export default authRoute;
