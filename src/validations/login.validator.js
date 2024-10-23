import { body } from 'express-validator';

export default [
  body('email')
    .notEmpty()
    .withMessage('email required')
    .isEmail()
    .withMessage('email must be valid'),
  body('password')
    .trim()
    .notEmpty()
    .withMessage('password required')
    .isLength({ min: 5 })
    .withMessage('password must be at least 5 characters long'),
];
