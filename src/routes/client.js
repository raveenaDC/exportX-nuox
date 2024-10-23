import { Router } from 'express';
import * as clientServices from '../services/client.service.js';
import * as validators from '../validations/index.js';
import * as middlewares from '../middleware/index.js';

const clientRoute = Router();
//const multerMiddleware = [];
clientRoute.get(
  '/',
  middlewares.authenticateMiddleWare,
  validators.clientGetValidators,
  middlewares.validationCheckMiddleWare,
  clientServices.list
);
clientRoute.get(
  '/:clientId',
  middlewares.authenticateMiddleWare,
  clientServices.get
);
clientRoute.post(
  '/urlInfo',
  middlewares.authenticateMiddleWare,
  clientServices.scanUrl
);
clientRoute.post(
  '/extractColor',
  middlewares.authenticateMiddleWare,
  middlewares.multerErrorHandleMiddleWare(
    middlewares.fileUploadMiddleware('images/')
  ),
  validators.imageCodeValidator,
  middlewares.validationCheckMiddleWare,
  clientServices.extractColor
);
clientRoute.post(
  '/',
  middlewares.authenticateMiddleWare,
  middlewares.multerErrorHandleMiddleWare(
    middlewares.fileUploadMiddleware('images/')
  ),
  validators.imageValidator,
  validators.clientValidator,
  middlewares.validationCheckMiddleWare,
  clientServices.createNew
);

clientRoute.put(
  '/:clientId/brandInfo',
  middlewares.authenticateMiddleWare,
  middlewares.multerErrorHandleMiddleWare(
    middlewares.fileUploadMiddleware('images/')
  ),
  validators.brandInfoValidator,
  validators.colorCodeValidator,
  middlewares.validationCheckMiddleWare,
  clientServices.addBrandInfo
);

clientRoute.put(
  '/:clientId/system-access',
  middlewares.authenticateMiddleWare,
  validators.userSystemAccessValidator,
  middlewares.validationCheckMiddleWare,
  clientServices.enableOrDisableSystemAccess
);
clientRoute.post(
  '/invite/client-user',
  middlewares.authenticateMiddleWare,
  validators.emailValidator,
  middlewares.validationCheckMiddleWare,
  clientServices.inviteClientUser
);
clientRoute.put(
  '/:clientId',
  middlewares.authenticateMiddleWare,
  middlewares.multerErrorHandleMiddleWare(
    middlewares.fileUploadMiddleware('images/')
  ),
  validators.colorCodeValidator,
  validators.updateImageValidators,
  middlewares.validationCheckMiddleWare,
  clientServices.update
);

clientRoute.put(
  '/:clientId/image-update',
  middlewares.authenticateMiddleWare,
  middlewares.multerErrorHandleMiddleWare(
    middlewares.fileUploadMiddleware('images/')
  ),
  validators.updateImageValidators,
  middlewares.validationCheckMiddleWare,
  clientServices.updateImage
);

clientRoute.delete(
  '/:clientId/brand-info/:brandId/:logoId',
  middlewares.authenticateMiddleWare,
  clientServices.removeBrandLogoImage
);
clientRoute.delete(
  '/:clientId/:brandId',
  middlewares.authenticateMiddleWare,
  clientServices.removeBrand
);
clientRoute.delete(
  '/:clientId/client-image/remove',
  middlewares.authenticateMiddleWare,
  clientServices.removeClientImage
);
// clientRoute.delete(
//   '/:clientId/client-brief',
//   middlewares.authenticateMiddleWare,
//   clientServices.removeClientBrief
// );
clientRoute.put(
  '/:clientId/client-brief',
  middlewares.authenticateMiddleWare,
  clientServices.updateClientBrief
);
clientRoute.put(
  '/:clientId/client-brief',
  middlewares.authenticateMiddleWare,
  validators.clientBriefValidator,
  middlewares.validationCheckMiddleWare,
  clientServices.addClientBrief
);
clientRoute.delete(
  '/:clientId/social-media/:arrayId',
  middlewares.authenticateMiddleWare,
  clientServices.removeSocialMedia
);
clientRoute.put(
  '/:clientId/social-media',
  middlewares.authenticateMiddleWare,
  clientServices.addSocialMedia
);
clientRoute.put(
  '/:clientId/add-brand-kit',
  middlewares.authenticateMiddleWare,
  middlewares.multerErrorHandleMiddleWare(
    middlewares.fileUploadMiddleware('images/')
  ),
  validators.brandKitLogoValidator,
  validators.colorCodeValidator,
  middlewares.validationCheckMiddleWare,
  clientServices.addBrandKit
);
// clientRoute.delete(
//   '/:clientId/brand-kit',
//   middlewares.authenticateMiddleWare,
//   clientServices.removeBrandKit
// );

clientRoute.delete(
  '/:clientId/brand-kit/:patternId',
  middlewares.authenticateMiddleWare,
  clientServices.removeBrandKitPattern
);

clientRoute.put(
  '/:clientId/brand-kit',
  middlewares.authenticateMiddleWare,
  middlewares.multerErrorHandleMiddleWare(
    middlewares.fileUploadMiddleware('images/')
  ),
  validators.brandKitLogoValidator,
  validators.colorCodeValidator,
  middlewares.validationCheckMiddleWare,
  clientServices.updateBrandKit
);
clientRoute.delete(
  '/:clientId/template/:templateId', // '/:clientId/template/:index',
  middlewares.authenticateMiddleWare,
  clientServices.removeTemplate
);
clientRoute.delete(
  '/:clientId/template',
  middlewares.authenticateMiddleWare,
  clientServices.removeAllTemplate
);
clientRoute.put(
  '/:clientId/template',
  middlewares.authenticateMiddleWare,
  middlewares.multerErrorHandleMiddleWare(
    middlewares.fileUploadMiddleware('images/')
  ),
  validators.updateTemplateValidator,
  middlewares.validationCheckMiddleWare,
  clientServices.addTemplate
);
clientRoute.delete(
  '/:clientId',
  middlewares.authenticateMiddleWare,
  clientServices.destroy
);

export default clientRoute;
