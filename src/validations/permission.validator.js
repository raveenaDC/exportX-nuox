import { body } from 'express-validator';

export default [
  body('permission').notEmpty().withMessage('permission required'),
  // body('description').notEmpty().withMessage('description required'),
];
