import { body } from 'express-validator';
import { removeMulterFiles } from '../utils/fs.helper.js';
import { mimeTypes } from '../registry/mimetype.registry.js';
export default [
  body('template').custom(async (value, { req }) => {
    if (
      req.files.template &&
      !mimeTypes.IMAGE.includes(req.files.template[0]['mimetype'])
    ) {
      await removeMulterFiles(req.files);
      throw new Error(`only ${mimeTypes.IMAGE.join(',')} are accepted`);
    }

    return true;
  }),
];
