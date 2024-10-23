import { body } from 'express-validator';

export default [
  body('information').notEmpty().withMessage('information is required'),
  body('instruction').notEmpty().withMessage('instruction is required'),
];
