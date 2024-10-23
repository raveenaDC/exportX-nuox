import { body } from 'express-validator';
import { removeMulterFiles } from '../utils/fs.helper.js';
import { mimeTypes } from '../registry/mimetype.registry.js';
export default [
  body('document').custom(async (value, { req }) => {
    if (!req.files) {
      throw new Error('document is required');
    }
    if (!req.files.document) {
      await removeMulterFiles(req.files);
      throw new Error('document is required');
    }

    if (!mimeTypes.PDF.includes(req.files.document[0]['mimetype'])) {
      await removeMulterFiles(req.files);
      throw new Error(`only ${mimeTypes.PDF.join(',')} are accepted`);
    }

    return true;
  }),
];
