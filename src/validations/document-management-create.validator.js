import { body } from 'express-validator';
import { removeMulterFiles } from '../utils/fs.helper.js';
import { mimeTypes } from '../registry/mimetype.registry.js';
export default [
  // body('documentType').notEmpty().withMessage('documentType required'),
  body('images').custom(async (value, { req }) => {
    // if (!req.files?.images) {
    //   // await removeMulterFiles(req.files);
    //   throw new Error('images are required');
    // }

    if (req.files.images) {
      const images = req.files?.images;
      //check for valid files
      let invalidFormat = false;
      images.forEach(async (image) => {
        if (!mimeTypes.IMAGE.includes(image['mimetype'])) invalidFormat = true;
      });

      if (invalidFormat) {
        // await removeMulterFiles(req.files);
        throw new Error(`only ${mimeTypes.IMAGE.join(',')} are accepted`);
      }
    }
    return true;
  }),
  // body('documents').custom(async (value, { req }) => {
  //   if (req.files.documents) {
  //     const documents = req.files.documents;
  //     //check for valid files
  //     let invalidFormat = false;
  //     for (const document of documents) {
  //       if (mimeTypes.IMAGE.includes(document['mimetype'])) {
  //         invalidFormat = true;
  //         break;
  //       }
  //     }

  //     if (invalidFormat) {
  //       // await removeMulterFiles(req.files);
  //       throw new Error(`only documents are accepted`);
  //     }
  //   }
  //   return true;
  // }),
];
