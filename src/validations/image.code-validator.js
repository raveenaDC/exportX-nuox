import { body } from 'express-validator';
import { removeMulterFiles } from '../utils/fs.helper.js';
import { mimeTypes } from '../registry/mimetype.registry.js';
export default [
  body('logoImage').custom(async (value, { req }) => {
    if (
      req.files.logoImage &&
      !mimeTypes.IMAGE.includes(req.files.logoImage[0]['mimetype'])
    ) {
      await removeMulterFiles(req.files);
      throw new Error(`only ${mimeTypes.IMAGE.join(',')} are accepted`);
    }

    return true;
  }),
];
