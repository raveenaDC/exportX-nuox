import { body } from 'express-validator';

export default [
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 3, max: 30 })
    .withMessage('First name must be between 3 and 30 characters')
    .matches(/^[a-zA-Z\s.]+$/)
    .withMessage('First name is invalid')
    .trim()
    .escape(),

  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 1, max: 30 })
    .withMessage('Last name must be between 1 and 30 characters')
    .matches(/^[a-zA-Z\s.]+$/)
    .withMessage('Last name is invalid')
    .trim()
    .escape(),
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .matches(/^[\w-]+(?:\.[\w-]+)*@(?:[\w-]+\.)+[a-zA-Z]{2,}$/)
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail()
    .trim()
    .escape(),
  body('designation').notEmpty().withMessage('designation required'),
  body('role').notEmpty().withMessage('role required'),
  // body('password')
  //   .notEmpty()
  //   .withMessage('Password is required')
  //   .isLength({ min: 5 })
  //   .withMessage('Password must be at least 5 characters long'),
  // body('contactNo').notEmpty().withMessage('contactNo required'),
  // body('isdCode').notEmpty().withMessage('isdCode required'),
  // body('country').notEmpty().withMessage('country name required'),
  // body('roleId').notEmpty().withMessage('roleId required'),
  //  body('systemAccess').notEmpty().withMessage('systemAccess required'),
  // body('type').notEmpty().withMessage('type required'),
];
