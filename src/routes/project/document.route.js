import { Router } from 'express';

import * as projectDocumentService from '../../services/project/document.service.js';
import * as validators from '../../validations/index.js';
import * as middlewares from '../../middleware/index.js';

const documentRoute = Router();

//create document
// documentRoute.post(
//   '/:projectId/documents/',
//   middlewares.authenticateMiddleWare,
//   middlewares.multerErrorHandleMiddleWare(
//     middlewares.fileUploadMiddleware('documents/')
//   ),
//   validators.documentValidator,
//   middlewares.validationCheckMiddleWare,
//   projectDocumentService.createDocument
// );
//get documents
documentRoute.get(
  '/:projectId/documents/',
  middlewares.authenticateMiddleWare,
  projectDocumentService.getAllDocuments
);
//delete document
documentRoute.delete(
  '/:projectId/documents/:documentId',
  middlewares.authenticateMiddleWare,
  projectDocumentService.removeDocument
);
//rename document
documentRoute.patch(
  '/:projectId/documents/:documentId',
  middlewares.authenticateMiddleWare,
  validators.documentRenameValidator,
  middlewares.validationCheckMiddleWare,
  projectDocumentService.renameDocument
);

//create document management
documentRoute.patch(
  '/:projectId/document-management',
  // middlewares.authenticateMiddleWare,
  middlewares.multerErrorHandleMiddleWare(
    middlewares.fileUploadMiddleware('project/')
  ),
  validators.documentManagementCrateValidator,
  middlewares.validationCheckMiddleWare,
  projectDocumentService.createDocumentManagement
);

//remove document management image
documentRoute.delete(
  '/:projectId/document-management/:imageId',
  middlewares.authenticateMiddleWare,
  projectDocumentService.removeImage
);

//get document types
documentRoute.get(
  '/document-types/get-all',
  middlewares.authenticateMiddleWare,
  projectDocumentService.getDocumentTypes
);

documentRoute.post(
  '/document-types',
  middlewares.authenticateMiddleWare,
  validators.documentTypeValidator,
  middlewares.validationCheckMiddleWare,
  projectDocumentService.createDocumentType
);

export default documentRoute;
