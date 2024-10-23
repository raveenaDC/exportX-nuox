import { body, param } from 'express-validator';
import { removeMulterFiles } from '../../utils/fs.helper.js';
import { mimeTypes } from '../../registry/mimetype.registry.js';
export default [
  body('image').custom(async (value, { req }) => {
    if (!req.files.image) throw new Error('image is required');
    if (!mimeTypes.IMAGE.includes(req.files.image[0]['mimetype'])) {
      throw `only ${mimeTypes.IMAGE.join(',')} are accepted`;
    }

    return true;
  }),
];
