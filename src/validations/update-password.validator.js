import { body } from 'express-validator';

export default [
  body('oldPassword').notEmpty().withMessage('oldPassword required'),
  body('newPassword').notEmpty().withMessage('newPassword required'),
];
