import httpStatus from 'http-status';
import { responseHelper } from '../../utils/response.helper.js';
import * as models from '../../db/models/index.js';
import { removeMulterFiles } from '../../utils/fs.helper.js';
import { unlinkSync } from 'fs';
import { mimeTypes } from '../../registry/mimetype.registry.js';
import { getCurrentWorkingFolder } from '../../utils/get-current-working-folder.helper.js';
import path from 'path';
const defaultPageLimit = process.env.PAGE_LIMIT;

/**
 * @body {File} document
 * @params {String} projectId
 * @returns {Object} document
 */
// export async function createDocument(req, res, next) {
//   try {
//     let { document } = req.files;
//     const { projectId } = req.params;

//     const project = await models.projectModel.findById(projectId);
//     if (!project) {
//       //remove uploaded files
//       await removeMulterFiles(req.files);
//       return responseHelper(
//         res,
//         httpStatus.NOT_FOUND,
//         true,
//         'Project not found'
//       );
//     }
//     document = document[0];
//     const updatedProject = await models.projectModel.findByIdAndUpdate(
//       projectId,
//       {
//         $push: {
//           documents: {
//             name: document.originalname,
//             fileName: document.filename,
//             path: '/cdn/uploads/documents/' + document.filename,
//             uploadedDate: new Date(),
//           },
//         },
//       },
//       { new: true }
//     );

//     const latestDocument =
//       updatedProject.documents[updatedProject.documents.length - 1];

//     return responseHelper(
//       res,
//       httpStatus.OK,
//       false,
//       'document uploaded successfully',
//       { document: latestDocument }
//     );
//   } catch (error) {
//     return next(new Error(error));
//   }
// }

/**
 * @params {String} projectId
 * @returns {Array}}
 */
export async function getAllDocuments(req, res, next) {
  try {
    const { projectId } = req.params;

    const project = await models.projectModel.findById(projectId);
    if (!project) {
      //remove uploaded files
      await removeMulterFiles(req.files);
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }

    const documents = await models.projectModel.findById(projectId, {
      documents: 1,
    });

    return responseHelper(res, httpStatus.OK, false, 'documents', {
      documents: documents.documents,
    });
  } catch (error) {
    return next(new Error(error));
  }
}

/**
 * @body {String} newName
 * @params {String} projectId
 * @params {String} documentId
 * @returns {Null}
 */
export async function removeDocument(req, res, next) {
  try {
    const { projectId, documentId } = req.params;

    const project = await models.projectModel.findById(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }

    const document = await models.projectModel.findOne(
      {
        _id: projectId,
        documents: { $elemMatch: { _id: documentId } },
      },
      {
        'documents.$': 1,
      }
    );

    if (!document) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Document not exists'
      );
    }

    //remove document from files
    const filePath = path.join(
      getCurrentWorkingFolder(import.meta.url),
      '../../../public/uploads/project/'
    );
    console.log(document['documents'][0]);
    const fileName = document['documents'][0].fileName;
    console.log(filePath + fileName);
    await unlinkSync(filePath + fileName);

    //update in db
    await models.projectModel.findByIdAndUpdate(
      projectId,
      {
        $pull: {
          documents: { _id: documentId },
        },
      },
      { new: true }
    );

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Document removed successfully',
      {}
    );
  } catch (error) {
    return next(new Error(error));
  }
}

/**
 * @params {String} projectId
 * @params {String} documentId
 * @returns {Object} document
 */
export async function renameDocument(req, res, next) {
  try {
    const { projectId, documentId } = req.params;

    const project = await models.projectModel.findById(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }

    const document = await models.projectModel.findOne(
      {
        _id: projectId,
        documents: { $elemMatch: { _id: documentId } },
      },
      {
        'documents.$': 1,
      }
    );

    if (!document) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Document not exists'
      );
    }

    const { newName } = req.body;

    const updatedProject = await models.projectModel.findOneAndUpdate(
      {
        _id: projectId,
        'documents._id': documentId,
      },
      {
        $set: {
          'documents.$.name': newName,
        },
      },
      { new: true }
    );

    const updatedDocument = updatedProject.documents.find((doc) =>
      doc._id.equals(documentId)
    );

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'Document renamed successfully',
      { document: updatedDocument }
    );
  } catch (error) {
    return next(new Error(error));
  }
}

/**
 * @body {Files} images
 * @params {String} projectId
 * @returns {Null}
 */
export async function createDocumentManagement(req, res, next) {
  try {
    const { projectId } = req.params;
    const { documentType } = req.body;
    const { images, documents } = req.files;

    const project = await models.projectModel.findById(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }
    if (!documents && !images) {
      return responseHelper(
        res,
        httpStatus.BAD_REQUEST,
        true,
        'either documents or images are required'
      );
    }

    //first update document type
    if (documentType && typeof documentType !== 'string') {
      await models.projectModel.findByIdAndUpdate(projectId, {
        documentType: documentType,
      });
    }
    //save images
    let query = {};

    if (images) {
      let updatedImages = images.map((image) => {
        return {
          name: image.originalname,
          fileName: image.filename,
          path: '/cdn/uploads/project/' + image.filename,
        };
      });
      query.images = updatedImages;
    }

    if (documents) {
      let updatedDocuments = documents.map((document) => {
        return {
          name: document.originalname,
          fileName: document.filename,
          path: '/cdn/uploads/project/' + document.filename,
        };
      });
      query.documents = updatedDocuments;
    }

    await models.projectModel.findByIdAndUpdate(
      projectId,
      {
        $push: query,
      },
      { new: true }
    );
    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'documents management updated successfully',
      {}
    );
  } catch (error) {
    console.log('289 error =>', error);
    return next(new Error(error));
  }
}

/**
 * @params {String} projectId
 * @params {String} imageId
 * @returns {Null}
 */
export async function removeImage(req, res, next) {
  try {
    const { projectId, imageId } = req.params;

    const project = await models.projectModel.findById(projectId);
    if (!project) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'Project not found'
      );
    }

    const image = await models.projectModel.findOne(
      {
        _id: projectId,
        images: { $elemMatch: { _id: imageId } },
      },
      {
        'images.$': 1,
      }
    );

    if (!image) {
      return responseHelper(
        res,
        httpStatus.NOT_FOUND,
        true,
        'image not exists'
      );
    }

    //remove document from files
    const filePath = path.join(
      getCurrentWorkingFolder(import.meta.url),
      '../../../public/uploads/project/'
    );
    const fileName = image['images'][0].fileName;
    await unlinkSync(filePath + fileName);

    //update in db
    await models.projectModel.findByIdAndUpdate(
      projectId,
      {
        $pull: {
          images: { _id: imageId },
        },
      },
      { new: true }
    );

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'image is removed successfully',
      {}
    );
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function getDocumentTypes(req, res, next) {
  try {
    const documentTypes = await models.documentTypeModel.find();

    return responseHelper(res, httpStatus.OK, false, 'document types', {
      documentTypes: documentTypes,
    });
  } catch (error) {
    console.log(error);
    return next(new Error(error));
  }
}

export async function createDocumentType(req, res, next) {
  try {
    const { documentType } = req.body;
    const documentTypeCheck = await models.documentTypeModel.findOne({
      documentType,
    });
    if (documentTypeCheck) {
      return responseHelper(
        res,
        httpStatus.CONFLICT,
        true,
        'document type already exists'
      );
    }
    const newDocumentType = await models.documentTypeModel.create({
      documentType,
    });

    return responseHelper(
      res,
      httpStatus.OK,
      false,
      'document type added successfully',
      {
        documentType: newDocumentType,
      }
    );
  } catch (error) {
    return next(new Error(error));
  }
}
