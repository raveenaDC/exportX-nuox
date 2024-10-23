import { body } from 'express-validator';
import { removeMulterFiles } from '../utils/fs.helper.js';
import { mimeTypes } from '../registry/mimetype.registry.js';

export default [
  body('brandUrl').notEmpty().isURL(),
  body('brandName').notEmpty().trim().escape(),
  body('brandDescription').notEmpty().trim().escape(),
  body('logoImage').custom(async (value, { req }) => {
    if (
      req.files.logoImage &&
      !mimeTypes.IMAGE.includes(req.files.logoImage[0]['mimetype'])
    ) {
      await removeMulterFiles(req.files);
      throw new Error(
        `Only ${mimeTypes.IMAGE.join(',')} are accepted for logoImage`
      );
    }

    return true;
  }),
  body('waterMarkImage').custom(async (value, { req }) => {
    if (
      req.files.waterMarkImage &&
      !mimeTypes.IMAGE.includes(req.files.waterMarkImage[0]['mimetype'])
    ) {
      await removeMulterFiles(req.files);
      throw new Error(
        `Only ${mimeTypes.IMAGE.join(',')} are accepted for waterMarkImage`
      );
    }

    return true;
  }),
];
