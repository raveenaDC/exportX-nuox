import { body } from 'express-validator';

export default [
  body('name').notEmpty().withMessage('name is required'),
  body('information').notEmpty().withMessage('information is required'),
  // body('params').notEmpty().withMessage('params is required'),
  body('instruction').notEmpty().withMessage('instruction is required'),
];
