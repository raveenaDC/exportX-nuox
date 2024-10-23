import { body } from 'express-validator';

export default [
  body('clientUserName')
    .notEmpty()
    .withMessage('Client user name is required')
    .isLength({ min: 3, max: 30 })
    .withMessage('Client user name must be between 3 and 30 characters')
    .matches(/^[a-zA-Z\s.]+$/)
    .withMessage('Client-user name is invalid')
    .trim()
    .escape(),

  body('clientUserEmail')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email address')
    .matches(/^[\w-]+(?:\.[\w-]+)*@(?:[\w-]+\.)+[a-zA-Z]{2,}$/)
    .withMessage('Invalid email address format')
    .normalizeEmail()
    .trim()
    .escape(),
];
