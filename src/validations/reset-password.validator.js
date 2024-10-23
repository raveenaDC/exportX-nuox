import { body } from 'express-validator';

export default [
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 4 })
    .withMessage('Password must be at least 4 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one numeric digit')
    .matches(/[\!\@\#\$\%\^\&\*\(\)\_\+\.\,\;\:]/)
    .withMessage(
      'Password must contain at least one special character (!, @, #, $, etc.)'
    ),
  body('token').notEmpty().withMessage('Token is required'),
];
