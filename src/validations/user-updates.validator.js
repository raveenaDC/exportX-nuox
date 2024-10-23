import { body } from 'express-validator';
import { removeMulterFiles } from '../utils/fs.helper.js';
import { mimeTypes } from '../registry/mimetype.registry.js';
export default [
  body('email')
    .if(body('email').exists())
    .isEmail()
    .matches(/^[\w-]+(?:\.[\w-]+)*@(?:[\w-]+\.)+[a-zA-Z]{2,}$/)
    .withMessage('Email must be valid'),
  body('userImage').custom(async (value, { req }) => {
    if (
      req.files.userImage &&
      !mimeTypes.IMAGE.includes(req.files.userImage[0]['mimetype'])
    ) {
      await removeMulterFiles(req.files);
      throw new Error(`only ${mimeTypes.IMAGE.join(',')} are accepted`);
    }

    return true;
  }),
  body('firstName')
    .if(body('firstName').exists())
    .isLength({ min: 3, max: 30 })
    .withMessage('First name must be between 3 and 30 characters')
    .matches(/^[a-zA-Z\s.]+$/)
    .withMessage('First name is invalid')
    .trim()
    .escape(),

  body('lastName')
    .if(body('lastName').exists())
    .isLength({ min: 1, max: 30 })
    .withMessage('Last name must be between 1 and 30 characters')
    .matches(/^[a-zA-Z\s.]+$/)
    .withMessage('Last name is invalid')
    .trim()
    .escape(),

  body('contactNo')
    .if(body('contactNo').exists())
    .isNumeric()
    .withMessage('Contact number must be numeric'),
];
