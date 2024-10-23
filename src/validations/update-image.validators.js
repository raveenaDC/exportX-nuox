import { body } from 'express-validator';
import { removeMulterFiles } from '../utils/fs.helper.js';
import { mimeTypes } from '../registry/mimetype.registry.js';
export default [
  body('clientImage').custom(async (value, { req }) => {
    if (
      req.files.clientImage &&
      !mimeTypes.IMAGE.includes(req.files.clientImage[0]['mimetype'])
    ) {
      await removeMulterFiles(req.files);
      throw new Error(`only ${mimeTypes.IMAGE.join(',')} are accepted`);
    }

    return true;
  }),
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
  body('waterMarkImage').custom(async (value, { req }) => {
    if (
      req.files.waterMarkImage &&
      !mimeTypes.IMAGE.includes(req.files.waterMarkImage[0]['mimetype'])
    ) {
      await removeMulterFiles(req.files);
      throw new Error(`only ${mimeTypes.IMAGE.join(',')} are accepted`);
    }

    return true;
  }),
];
