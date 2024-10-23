import { body } from 'express-validator';
import { removeMulterFiles } from '../utils/fs.helper.js';
import { mimeTypes } from '../registry/mimetype.registry.js';
export default [
  body('brandKitLogo').custom(async (value, { req }) => {
    if (
      req.files.brandKitLogo &&
      !mimeTypes.IMAGE.includes(req.files.brandKitLogo[0]['mimetype'])
    ) {
      await removeMulterFiles(req.files);
      throw new Error(`only ${mimeTypes.IMAGE.join(',')} are accepted`);
    }

    return true;
  }),
  body('brandPattern').custom(async (value, { req }) => {
    if (
      req.files.brandPattern &&
      !mimeTypes.IMAGE.includes(req.files.brandPattern[0]['mimetype'])
    ) {
      await removeMulterFiles(req.files);
      throw new Error(`only ${mimeTypes.IMAGE.join(',')} are accepted`);
    }

    return true;
  }),
];
