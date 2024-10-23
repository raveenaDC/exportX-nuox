import { body } from 'express-validator';
import { removeMulterFiles } from '../utils/fs.helper.js';
import { mimeTypes } from '../registry/mimetype.registry.js';

export default [
  body('video').custom(async (value, { req }) => {
    if (
      req.files.video &&
      !mimeTypes.VIDEO.includes(req.files.video[0]['mimetype'])
    ) {
      await removeMulterFiles(req.files);
      throw new Error(`only ${mimeTypes.VIDEO.join(',')} are accepted`);
    } else if (!req.files.video) {
      throw new Error('No files were uploaded');
    }

    return true;
  }),
];
