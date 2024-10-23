import { body } from 'express-validator';
import { removeMulterFiles } from '../utils/fs.helper.js';
import { mimeTypes } from '../registry/mimetype.registry.js';

export default [
  body('uploadImage').custom(async (value, { req }) => {
    if (
      req.files.uploadImage &&
      !mimeTypes.IMAGE.includes(req.files.uploadImage[0]['mimetype'])
    ) {
      await removeMulterFiles(req.files);
      throw new Error(`only ${mimeTypes.IMAGE.join(',')} are accepted`);
    } else if (!req.files.uploadImage) {
      throw new Error('No files were uploaded');
    }

    return true;
  }),
];
